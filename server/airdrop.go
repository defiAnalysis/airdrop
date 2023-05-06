package server

import (
	"context"
	"github.com/astaxie/beego"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"math/big"
)

func init() {
	beego.LoadAppConfig("ini", "../conf/app.conf")
}

type Airdrop struct {
	Address   []common.Address
	Values    []*big.Int
	MaxValue  float64
	MinValue  float64
	Count     int
	TokenAddr common.Address
	client    *ethclient.Client
}

func CreateAirdrop(Count int, MaxValue float64, MinValue float64) *Airdrop {
	return &Airdrop{
		MaxValue: MaxValue,
		MinValue: MinValue,
		Count:    Count,
		Address:  make([]common.Address, Count),
		Values:   make([]*big.Int, Count),
	}
}

func (this *Airdrop) Run() {
	symbol := beego.AppConfig.String("chain::symbol")
	beego.Info("symbol:", symbol)

	url := beego.AppConfig.String("rpc::" + symbol)
	beego.Info("url:", url)
	client, err := ethclient.Dial(url)

	if err != nil {
		beego.Error("节点客户端初始化异常：", err)

	} else {
		this.client = client

		blockheight, err := this.client.BlockNumber(context.Background())
		if err != nil {
			beego.Error("节点客户端初始化异常：", err)
		}

		beego.Info("blockheight:", blockheight)
	}

	this.createAdrAndValue()
	this.sendTx()
}

func (this *Airdrop) createAdrAndValue() {
	addrs := CreateAddresss(this.Count)
	values := RandFloats(this.MinValue, this.MaxValue, this.Count)

	if len(addrs) != len(values) {
		beego.Error("err len")

		return
	}

	for i := range this.Address {
		this.Address[i] = addrs[i]
		_strValue := Float2String(values[i], 18)
		this.Values[i], _ = new(big.Int).SetString(_strValue, 10)
	}
}

func (this *Airdrop) sendTx() {
	privkeySigner := ""
	chainSymbol := beego.AppConfig.String("chain::symbol")
	contract := beego.AppConfig.String("airdrop::" + chainSymbol)
	transactionReceipt, err := TokenAirdrop(chainSymbol, contract, privkeySigner, this.Address, this.Values)
	if err == nil && transactionReceipt != nil && transactionReceipt.Status == 1 {
		beego.Info("[空投]-成功 : ", transactionReceipt.TxHash)
	} else {
		beego.Error("[空投]-失败 : ", err)

		return
	}

	return
}
