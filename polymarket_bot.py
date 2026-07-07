"""
Polymarket BTC 5m Trading Bot - Fixed market detection
"""

import time, json, requests
import warnings
warnings.filterwarnings("ignore")  # suppress SSL warnings

# ── YOUR CREDENTIALS ─────────────────────────────────────────────────────────
PRIVATE_KEY   = "0x08bd6b9b56584cdf69aa1c2a2b399ea8624ceab6e074bd876fa31a87b925447e"
PROXY_WALLET  = "0x66f2407b50845C37dffF757340dbeF293747AA4B"
RELAYER_KEY   = "019e592b-26c4-7505-a2bf-6a4fd7843741"
SIGNER_ADDR   = "0x597e5DD05a426D563AA5E17DC5D4d1C1B7649F73"

# ── CONFIG ────────────────────────────────────────────────────────────────────
BET_AMOUNT    = 1.0
PROFIT_TARGET = 1.5    # sell when price reaches 1.5x buy price (50% profit)
GAMMA_API     = "https://gamma-api.polymarket.com"
CLOB_API      = "https://clob.polymarket.com"

# ── CLIENT SETUP ──────────────────────────────────────────────────────────────
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY, SELL

client = ClobClient(
    CLOB_API,
    key=PRIVATE_KEY,
    chain_id=137,
    signature_type=0,
    funder=PROXY_WALLET
)
client.set_api_creds(client.create_or_derive_api_creds())
print("✅ Connected!")

# ── HELPERS ───────────────────────────────────────────────────────────────────
def get_current_round_slug():
    ts = int(time.time() // 300) * 300
    return f"btc-updown-5m-{ts}"

def get_active_btc_market():
    slug = get_current_round_slug()
    try:
        resp = requests.get(f"{GAMMA_API}/events", params={"slug": slug}, verify=False).json()
        events = resp if isinstance(resp, list) else resp.get("events", [])
        if events:
            event = events[0]
            markets = event.get("markets", [])
            if markets:
                return event, markets[0]
    except Exception as e:
        print(f"  ⚠️ API error: {e}")
    return None, None

def get_price(token_id, side):
    try:
        return float(client.get_price(token_id, side=side)["price"])
    except:
        return None

def get_time_remaining(end_date_str):
    from datetime import datetime, timezone
    end = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
    return max(0, (end - datetime.now(timezone.utc)).total_seconds())

def buy(token_id, price):
    try:
        size   = round(BET_AMOUNT / price, 2)
        order  = OrderArgs(token_id=token_id, price=round(price, 2), size=size, side=BUY)
        signed = client.create_order(order)
        resp   = client.post_order(signed, OrderType.GTC)
        print(f"  ✅ BUY {size} shares @ {price:.2f} | {resp}")
        return size
    except Exception as e:
        print(f"  ❌ BUY FAILED: {e}")
        return 0

def sell(token_id, shares, reason):
    try:
        spx    = get_price(token_id, "SELL") or 0
        order  = OrderArgs(token_id=token_id, price=round(spx, 2), size=shares, side=SELL)
        signed = client.create_order(order)
        resp   = client.post_order(signed, OrderType.GTC)
        print(f"  ✅ SELL {reason} @ {spx:.2f} | {resp}")
    except Exception as e:
        print(f"  ❌ SELL FAILED: {e}")

def trade(event, market):
    end_date  = event.get("endDate") or event.get("end_date_iso")
    token_ids = json.loads(market.get("clobTokenIds", "[]"))
    outcomes  = json.loads(market.get("outcomes", '["Up","Down"]'))

    if len(token_ids) < 2:
        print("  ⚠️ Not enough token IDs"); return

    up_tok = token_ids[outcomes.index("Up")]
    dn_tok = token_ids[outcomes.index("Down")]

    up_px = get_price(up_tok, "BUY")
    dn_px = get_price(dn_tok, "BUY")
    if not up_px or not dn_px:
        print("  ⚠️ Cannot fetch prices"); return

    print(f"  Up={up_px:.0%}  Down={dn_px:.0%}")

    if up_px <= dn_px:
        tok, px, lbl = up_tok, up_px, "UP"
    else:
        tok, px, lbl = dn_tok, dn_px, "DOWN"

    print(f"  → Buying {lbl} @ {px:.0%} (best value)")
    shares = buy(tok, px)
    if not shares: return

    while True:
        time.sleep(2)
        rem = get_time_remaining(end_date) if end_date else 0
        spx = get_price(tok, "SELL") or 0
        print(f"  {rem:.0f}s | sell={spx:.0%} | bought={px:.0%}")

        if rem <= 0:
            print("  ⏰ Expired — round ended"); break
        if spx >= px * PROFIT_TARGET:
            sell(tok, shares, f"+50% profit @ {spx:.0%}"); break
        if rem <= 40:
            if spx * shares >= BET_AMOUNT * 0.5:
                sell(tok, shares, f"40s recovery @ {spx:.0%}")
            else:
                print("  40s: too low — letting expire")
            break

# ── MAIN ──────────────────────────────────────────────────────────────────────
def run():
    last_slug = None
    print("🤖 Bot running...\n")
    while True:
        try:
            event, market = get_active_btc_market()
            slug = get_current_round_slug()

            if not event:
                print(f"⏳ No market for slug {slug} — waiting..."); time.sleep(10); continue

            if slug != last_slug:
                print(f"\n🆕 {event.get('title')}")
                last_slug = slug
                trade(event, market)
            else:
                time.sleep(5)

        except KeyboardInterrupt:
            print("\n🛑 Stopped"); break
        except Exception as e:
            print(f"❌ {e}"); time.sleep(5)

if __name__ == "__main__":
    run()
