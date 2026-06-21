/* App shell — orchestrates the browse → order → pay → retrieve flow. */
function mkKeys(product, qty) {
  const seg = () => Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(4, 'X').slice(0, 4);
  const prefix = (product.name.match(/[A-Za-z]+/) || ['CARD'])[0].toUpperCase().slice(0, 5);
  return Array.from({ length: qty }, () => `${prefix}-${seg()}-${seg()}-${seg()}-${seg()}`);
}
function mkOrderNo() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return `MK${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${rand}`;
}
/* sample delivered order for manual lookups in the demo */
window.MK_SAMPLE_ORDER = function (query) {
  const p = window.MK_PRODUCTS[2];
  const qty = 1;
  return {
    orderNo: query && /^MK/i.test(query) ? query.toUpperCase() : mkOrderNo(),
    product: p, qty, email: query && query.includes('@') ? query : 'buyer@example.com',
    total: p.price * qty, status: 'delivered', keys: mkKeys(p, qty),
  };
};

function App() {
  const [screen, setScreen] = React.useState('home');
  const [product, setProduct] = React.useState(null);
  const [order, setOrder] = React.useState(null);

  const go = (s) => { setScreen(s); window.scrollTo(0, 0); };

  const selectProduct = (p) => { setProduct(p); go('detail'); };
  const buy = (o) => { setOrder({ ...o, orderNo: mkOrderNo(), status: 'pending' }); go('pay'); };
  const paid = (o) => { setOrder({ ...o, status: 'delivered', keys: mkKeys(o.product, o.qty) }); go('lookup'); };

  const barProps =
    screen === 'detail' ? { back: true, onBack: () => go('home'), title: '商品详情' } :
    screen === 'pay' ? { back: true, onBack: () => go('detail'), title: '确认支付' } :
    screen === 'lookup' ? { back: true, onBack: () => go('home'), title: '订单查询 / 取卡' } :
    {};

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar onHome={() => go('home')} onLookup={() => { go('lookup'); }} {...barProps} />
      {screen === 'home' && <StorefrontHome onSelect={selectProduct} />}
      {screen === 'detail' && product && <ProductDetail product={product} onBuy={buy} />}
      {screen === 'pay' && order && <PaymentScreen order={order} onPaid={paid} />}
      {screen === 'lookup' && <OrderLookup order={order && order.status === 'delivered' ? order : null} onShop={() => go(order ? 'pay' : 'home')} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
