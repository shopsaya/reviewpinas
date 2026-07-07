from py_clob_client.client import ClobClient

PRIVATE_KEY  = "0x08bd6b9b56584cdf69aa1c2a2b399ea8624ceab6e074bd876fa31a87b925447e"  # paste your key
PROXY_WALLET = "0x32cab689eC9e6a16549A70A91e2219CD41C08457"
SIGNER_ADDR  = "0x3b0d0f15b0cc0422626619c724f2581446c28be6"
CLOB_API     = "https://clob.polymarket.com"

configs = [
    (0, SIGNER_ADDR,  "type=0 funder=signer"),
    (0, PROXY_WALLET, "type=0 funder=proxy"),
    (1, PROXY_WALLET, "type=1 funder=proxy"),
    (1, SIGNER_ADDR,  "type=1 funder=signer"),
    (2, PROXY_WALLET, "type=2 funder=proxy"),
]

for sig_type, funder, label in configs:
    try:
        c = ClobClient(CLOB_API, key=PRIVATE_KEY, chain_id=137, signature_type=sig_type, funder=funder)
        creds = c.create_or_derive_api_creds()
        c.set_api_creds(creds)
        print(f"SUCCESS: {label}")
        print(f"  api_key={creds.api_key}")
        break
    except Exception as e:
        print(f"FAIL: {label} -> {str(e)[:80]}")
