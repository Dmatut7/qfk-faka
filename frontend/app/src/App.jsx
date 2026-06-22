import React from 'react';
import TopBar from './components/TopBar.jsx';
import StorefrontHome from './screens/StorefrontHome.jsx';
import ProductDetail from './screens/ProductDetail.jsx';
import PaymentScreen from './screens/PaymentScreen.jsx';
import OrderLookup from './screens/OrderLookup.jsx';
import Articles from './screens/Articles.jsx';
import PlatformKefu from './components/PlatformKefu.jsx';
import { api, normalizeProduct } from './api.js';

/* App 外壳:浏览 → 下单 → 付款 → 取卡。状态在此集中,各屏只收 props。 */
export default function App() {
  const [screen, setScreen] = React.useState('home');
  const [productId, setProductId] = React.useState(null);
  const [order, setOrder] = React.useState(null);      // 已创建订单(进入支付)
  const [result, setResult] = React.useState(null);    // 已发货订单(进入取卡结果)

  // 店铺 + 分类 + 在售商品(首页用,顺便给 TopBar 店名)
  const [shop, setShop] = React.useState(null);
  const [categories, setCategories] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [homeLoading, setHomeLoading] = React.useState(true);
  const [homeError, setHomeError] = React.useState('');

  // 平台公开配置(站点信息 + 平台客服 + 查单风险提示)。无鉴权,启动即拉一次;失败静默(不阻塞商城)。
  const [config, setConfig] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    api.config().then((c) => { if (alive) setConfig(c); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const loadShop = React.useCallback(() => {
    setHomeLoading(true);
    setHomeError('');
    api
      .shop()
      .then((data) => {
        // 平台公告(data.notices)随店铺数据下发,挂到 store 上交给首页顶部展示。
        const store = data.store ? { ...data.store, notices: Array.isArray(data.notices) ? data.notices : [] } : null;
        setShop(store);
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setProducts((data.products || []).map(normalizeProduct));
      })
      .catch((e) => setHomeError(e.message || '店铺加载失败'))
      .finally(() => setHomeLoading(false));
  }, []);

  React.useEffect(() => { loadShop(); }, [loadShop]);

  const go = (s) => { setScreen(s); window.scrollTo(0, 0); };

  const [selected, setSelected] = React.useState(null); // 已点击的列表商品对象(给详情页预填)
  const selectProduct = (p) => { setSelected(p); setProductId(p.id); go('detail'); };

  // 下单成功(ProductDetail 已调用后端):组装支付页所需 order
  const onOrderCreated = (apiOrder, email, product) => {
    setOrder({
      orderNo: apiOrder.order_no,
      total: Number(apiOrder.total_amount),
      expireAt: apiOrder.expire_at,
      qty: Number(apiOrder.quantity),
      email,
      product,
    });
    go('pay');
  };

  // 发货完成(PaymentScreen 轮询拿到 status=2)。后端查单只返回 product_id,
  // 这里把已知的商品对象并入,取卡页就能显示真实商品名/缩略图而非「商品 #id」。
  const onPaid = (deliveredOrder) => {
    setResult(order?.product ? { ...deliveredOrder, product: order.product } : deliveredOrder);
    go('result');
  };

  const barProps =
    screen === 'detail' ? { back: true, onBack: () => go('home'), title: '商品详情' } :
    screen === 'pay' ? { back: true, onBack: () => go('detail'), title: '确认支付' } :
    screen === 'result' ? { back: true, onBack: () => go('home'), title: '取卡 / 订单' } :
    screen === 'lookup' ? { back: true, onBack: () => go('home'), title: '订单查询 / 取卡' } :
    screen === 'news' ? { back: true, onBack: () => go('home'), title: '最新资讯' } :
    screen === 'faq' ? { back: true, onBack: () => go('home'), title: '常见问题' } :
    {};

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar
        shopName={shop?.name}
        shopIntro={shop?.intro}
        onHome={() => go('home')}
        onLookup={() => { setResult(null); go('lookup'); }}
        onNews={() => go('news')}
        onFaq={() => go('faq')}
        {...barProps}
      />

      {screen === 'home' && (
        <StorefrontHome
          shop={shop}
          categories={categories}
          products={products}
          loading={homeLoading}
          error={homeError}
          onReload={loadShop}
          onSelect={selectProduct}
        />
      )}

      {screen === 'detail' && productId != null && (
        <ProductDetail
          productId={productId}
          initialProduct={selected}
          shop={shop}
          onBack={() => go('home')}
          onOrderCreated={onOrderCreated}
        />
      )}

      {screen === 'pay' && order && (
        <PaymentScreen order={order} onBack={() => go('detail')} onPaid={onPaid} />
      )}

      {screen === 'result' && result && (
        <OrderLookup initialResult={result} onBack={() => go('home')} queryTips={config?.order_query_tips} />
      )}

      {screen === 'lookup' && <OrderLookup onBack={() => go('home')} queryTips={config?.order_query_tips} />}

      {screen === 'news' && <Articles type={1} onBack={() => go('home')} />}
      {screen === 'faq' && <Articles type={2} onBack={() => go('home')} />}

      {/* 全局平台客服悬浮按钮(买家所有页面共用,区别于店铺商户客服) */}
      <PlatformKefu kefu={config?.kefu} />
    </div>
  );
}
