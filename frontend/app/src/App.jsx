import React from 'react';
import TopBar from './components/TopBar.jsx';
import StorefrontHome from './screens/StorefrontHome.jsx';
import ProductDetail from './screens/ProductDetail.jsx';
import PaymentScreen from './screens/PaymentScreen.jsx';
import OrderLookup from './screens/OrderLookup.jsx';
import { api, normalizeProduct } from './api.js';

/* App 外壳:浏览 → 下单 → 付款 → 取卡。状态在此集中,各屏只收 props。 */
export default function App() {
  const [screen, setScreen] = React.useState('home');
  const [productId, setProductId] = React.useState(null);
  const [order, setOrder] = React.useState(null);      // 已创建订单(进入支付)
  const [result, setResult] = React.useState(null);    // 已发货订单(进入取卡结果)

  // 店铺 + 在售商品(首页用,顺便给 TopBar 店名)
  const [shop, setShop] = React.useState(null);
  const [products, setProducts] = React.useState([]);
  const [homeLoading, setHomeLoading] = React.useState(true);
  const [homeError, setHomeError] = React.useState('');

  const loadShop = React.useCallback(() => {
    setHomeLoading(true);
    setHomeError('');
    api
      .shop()
      .then((data) => {
        setShop(data.store || null);
        setProducts((data.products || []).map(normalizeProduct));
      })
      .catch((e) => setHomeError(e.message || '店铺加载失败'))
      .finally(() => setHomeLoading(false));
  }, []);

  React.useEffect(() => { loadShop(); }, [loadShop]);

  const go = (s) => { setScreen(s); window.scrollTo(0, 0); };

  const selectProduct = (p) => { setProductId(p.id); go('detail'); };

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

  // 发货完成(PaymentScreen 轮询拿到 status=2)
  const onPaid = (deliveredOrder) => { setResult(deliveredOrder); go('result'); };

  const barProps =
    screen === 'detail' ? { back: true, onBack: () => go('home'), title: '商品详情' } :
    screen === 'pay' ? { back: true, onBack: () => go('detail'), title: '确认支付' } :
    screen === 'result' ? { back: true, onBack: () => go('home'), title: '取卡 / 订单' } :
    screen === 'lookup' ? { back: true, onBack: () => go('home'), title: '订单查询 / 取卡' } :
    {};

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar
        shopName={shop?.name}
        shopIntro={shop?.intro}
        onHome={() => go('home')}
        onLookup={() => { setResult(null); go('lookup'); }}
        {...barProps}
      />

      {screen === 'home' && (
        <StorefrontHome
          shop={shop}
          products={products}
          loading={homeLoading}
          error={homeError}
          onReload={loadShop}
          onSelect={selectProduct}
        />
      )}

      {screen === 'detail' && productId != null && (
        <ProductDetail productId={productId} onBack={() => go('home')} onOrderCreated={onOrderCreated} />
      )}

      {screen === 'pay' && order && (
        <PaymentScreen order={order} onBack={() => go('detail')} onPaid={onPaid} />
      )}

      {screen === 'result' && result && (
        <OrderLookup initialResult={result} onBack={() => go('home')} />
      )}

      {screen === 'lookup' && <OrderLookup onBack={() => go('home')} />}
    </div>
  );
}
