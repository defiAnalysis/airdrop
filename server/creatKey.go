package server

import (
	"crypto/ecdsa"
	"errors"
	"github.com/astaxie/beego"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/shopspring/decimal"
	"math/rand"
	"strings"
)

func CreateAddresss(n int) []common.Address {
	res := make([]common.Address, n)

	for i := range res {
		addr, err := createAddress()

		if err != nil {
			beego.Error("err:", err)

			continue
		}

		res[i] = addr
	}

	return res
}

func createAddress() (common.Address, error) {
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		return common.Address{}, err
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return common.Address{}, errors.New("!ok")
	}

	address := crypto.PubkeyToAddress(*publicKeyECDSA).Hex()

	return common.HexToAddress(address), nil
}

func RandFloats(min, max float64, n int) []float64 {
	res := make([]float64, n)
	for i := range res {
		res[i] = min + rand.Float64()*(max-min)
	}
	return res
}

// 精度处理
// ("100.000000",8) = 10000000000
func Float2String(value float64, d int) string {
	f := decimal.NewFromFloat(value)
	d1 := decimal.NewFromInt(10).Pow(decimal.NewFromInt(int64(d)))
	f2 := f.Mul(d1).String()
	if strings.Contains(f2, ".") {
		f2 = strings.Split(f2, ".")[0]
	}

	return f2
}
