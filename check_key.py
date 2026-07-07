from eth_account import Account

# Paste your private key here
PRIVATE_KEY = "0x08bd6b9b56584cdf69aa1c2a2b399ea8624ceab6e074bd876fa31a87b925447e"  # put your key here

acct = Account.from_key(PRIVATE_KEY)
print(f"Your key generates address: {acct.address}")
print(f"Expected signer address:   0x597e5DD05a426D563AA5E17DC5D4d1C1B7649F73")
print(f"Match: {acct.address.lower() == '0x597e5DD05a426D563AA5E17DC5D4d1C1B7649F73'}")
