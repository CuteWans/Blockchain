from bitcoin.core.script import *

######################################################################
# This function will be used by Alice and Bob to send their respective
# coins to a utxo that is redeemable either of two cases:
# 1) Recipient provides x such that hash(x) = hash of secret 
#    and recipient signs the transaction.
# 2) Sender and recipient both sign transaction
# 
# TODO: Fill this in to create a script that is redeemable by both
#       of the above conditions.
# 
# See this page for opcode: https://en.bitcoin.it/wiki/Script
#
#

# This is the ScriptPubKey for the swap transaction
def coinExchangeScript(public_key_sender, public_key_recipient, hash_of_secret):
    return [
        # 首先检查是否包括接收者的签名，如果接收者的签名都没有，那么一定不对
        public_key_recipient,
        OP_CHECKSIGVERIFY,
        # 对于剩余的元素进行复制，从而检测其是否为秘密或者是另一个签名
        OP_DUP,
        OP_HASH160,
        hash_of_secret,
        OP_EQUAL,
        # 如果不是秘密，检查是否为自己的签名
        OP_NOTIF,
        public_key_sender,
        OP_CHECKSIG,
        OP_ELSE,
        OP_DROP,
        OP_TRUE,
        OP_ENDIF
    ]

# This is the ScriptSig that the receiver will use to redeem coins
def coinExchangeScriptSig1(sig_recipient, secret):
    return [
        # 交换，输入secret和签名
        secret,
        sig_recipient
    ]

# This is the ScriptSig for sending coins back to the sender if unredeemed
def coinExchangeScriptSig2(sig_sender, sig_recipient):
    return [
        # 赎回，两方的签名
        sig_sender,
        sig_recipient
    ]

#
#
######################################################################

