"""
Diagnostic: dumps the signed order before sending to see what's wrong
"""
import warnings, json
warnings.filterwarnings("ignore")

PRIVATE_KEY  = "0x08bd6b9b56584cdf69aa1c2a2b399ea8624ceab6e074bd876fa31a87b925447e"
PROXY_WALLET = "0x597e5DD05a426D563AA5E17DC5D4d1C1B7649F73"
CLOB_API     = "https://clob.polymarket.com"

from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

# Try each signature type and show what happens
for sig_type in [0, 1, 2]:
    print(f"\n--- signature_type={sig_type} ---")
    try:
        c = ClobClient(CLOB_API, key=PRIVATE_KEY, chain_id=137,
                       signature_type=sig_type, funder=PROXY_WALLET)
        c.set_api_creds(c.create_or_derive_api_creds())
        print(f"  ✅ Connected")

        # Dummy order — BTC 5m Up token from a recent round (just to test signing)
        token_id = "95047306597237900783506697048082686820637104719329965367898615232752402285421"
        order = OrderArgs(token_id=token_id, price=0.50, size=2.0, side=BUY)
        signed = c.create_order(order)

        # Dump the signed order fields
        d = signed.dict() if hasattr(signed, 'dict') else vars(signed)
        print(f"  Signed order fields: {json.dumps(d, default=str)[:400]}")

        # Try posting
        resp = c.post_order(signed, OrderType.GTC)
        print(f"  POST resp: {resp}")
    except Exception as e:
        print(f"  ❌ {e}")
