import { Contract, ContractFactory, ethers, Signer } from "ethers";
import { Interface } from "ethers/lib/utils";
import {
  ABI,
  Address,
  DeployOptions,
  DeployResult,
} from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { logtools } from "./util_log";
import * as fs from "fs";

export class ContractInfo {
  static getContract(name: string): Contract {
    let info = ContractInfo.contractinfos[name];
    return ContractFactory.getContract(info.address, info.abi, info.deployer);
  }

  static getContractProxy(target: string, proxy: string): Contract {
    let targetContract = ContractInfo.contractinfos[target];
    let proxyContract = ContractInfo.contractinfos[proxy];

    return ContractFactory.getContract(
      proxyContract.address,
      targetContract.abi,
      targetContract.deployer
    );
  }

  static getContractAbi(name: string): ethers.ContractInterface {
    let info = ContractInfo.contractinfos[name];
    return info.abi;
  }
  static getContractAddress(name: string): string {
    let info = ContractInfo.contractinfos[name];
    return info.address;
  }
  static getContractName(addr: string): string | null {
    for (var key in ContractInfo.contractinfos) {
      if (ContractInfo.contractinfos[key].address == addr) return key;
    }
    return null;
  }
  static CheckContractByAddr(addr: string): boolean {
    let name = this.getContractName(addr);
    if (name != null) {
      logtools.loggreen("CheckContractByAddr:" + addr + "=>" + name);
      return true;
    } else {
      logtools.logred("CheckContractByAddr Fail:" + addr);
      return false;
    }
  }
  static HadContractChange(names: string[]): boolean {
    for (var i = 0; i < names.length; i++) {
      if (true == ContractInfo.contractnewly[names[i]]) return true;
    }
    return false;
  }
  static async LoadFromFile(hre: HardhatRuntimeEnvironment) {
    ContractInfo.contractnewly = {};
    let signers = await hre.ethers.getSigners();

    logtools.UpdateConfigFileName(hre);
    let buffer = fs.readFileSync(logtools.configfile);
    let srcjson = JSON.parse(buffer.toString())["contracts"];
    for (var key in srcjson) {
      var deployer = srcjson[key]["deployer"];
      var addr = srcjson[key]["addr"];
      var func = srcjson[key]["func"];
      var abi = srcjson[key]["abi"];
      let signer: Signer | null = null;

      for (var i = 0; i < signers.length; i++) {
        if (signers[i].address == deployer) {
          signer = signers[i];
        }
      }
      if (signer == null) throw "error signer";
      ContractInfo.contractinfos[key] = {
        address: addr,
        abi: abi,
        func: func,
        deployer: signer,
      };
    }
  }
  // static async Deploy(hre: HardhatRuntimeEnvironment, name: string, option: DeployOptions): Promise<boolean>
  // {
  //     if (undefined != ContractInfo.contractinfos[name])
  //         console.log("==skip deploy:" + name);
  //     console.log("--deploy");
  //
  //
  //     let address: string = "";
  //     let abi: Interface;
  //     let bytecode: string = "";
  //     let newly: boolean = false;
  //     if (hre.network.name == "hardhat")
  //     {
  //
  //         let factory = await hre.ethers.getContractFactory(name, { libraries: option.libraries });
  //
  //         let c: Contract;
  //         if (option.args == null)
  //         {
  //             c = await factory.deploy();
  //         }
  //         else
  //         {
  //             c = await factory.deploy(...option.args);
  //         }
  //         address = c.address;
  //         abi = factory.interface;
  //         bytecode = factory.bytecode;
  //     }
  //     else
  //     {
  //         let result = await hre.deployments.deploy(name, option);
  //         console.log((result.newlyDeployed ? "==deploy:" : "==reuse") + name);
  //         address = result.address;
  //         abi = new Interface(result.abi);
  //         newly = result.newlyDeployed;
  //     }
  //     //get readable abi
  //
  //     let readable = abi.format('full') as string[];
  //     let signer = await hre.ethers.getSigner(option.from);
  //
  //     //save contracts
  //     ContractInfo.contractnewly[name] = newly;
  //     let resultinfo = { address: address, abi: abi, deployer: signer, bytecode: bytecode };
  //     ContractInfo.contractinfos[name] = resultinfo;
  //
  //
  //     logtools.UpdateConfigFileName(hre);
  //     //log to hardhatinfo.json
  //     if (bytecode != null)
  //         logtools.SetContract(name, option.from, address, readable, bytecode);
  //
  //     //用xverify，不需要这个机制了
  //     // //gen a temp verify cmdline
  //     // let cmdline = "npx hardhat verify --network bscTest \"" + result.address + "\" ";
  //     // try {
  //     //     let ss = result.storageLayout["storage"][0];
  //     //     if (ss != undefined) {
  //     //         cmdline += " --contract \"" + ss["contract"] + "\"";
  //     //         //console.log("result:" + JSON.stringify(ss));
  //     //     }
  //     //     else {
  //
  //     //         cmdline += " --contract \"" + await this.GetSolName(name) + ":" + name + "\"";
  //
  //     //     }
  //     //     if (result.args != null) {
  //     //         for (var i = 0; i < result.args.length; i++) {
  //     //             cmdline += (" \"" + result.args[i].toString() + "\"");
  //     //         }
  //     //     }
  //     // }
  //     // catch
  //     // {
  //     //     cmdline += " --error:" + name;
  //     // }
  //     // //console.log("verifyline:" + cmdline);
  //     // logtools.Append(cmdline);
  //
  //
  //     return true;
  // }

  static async Deploy(
    hre: HardhatRuntimeEnvironment,
    name: string,
    option: DeployOptions
  ): Promise<boolean> {
    if (undefined != ContractInfo.contractinfos[name])
      console.log("==skip deploy:" + name);
    console.log("--deploy");

    let address: string = "";
    let func: any;
    let abi: any;
    let bytecode: string = "";
    let newly: boolean = false;
    if (hre.network.name == "hardhat") {
      let factory = await hre.ethers.getContractFactory(name, {
        libraries: option.libraries,
      });

      let c: Contract;
      if (option.args == null) {
        c = await factory.deploy();
      } else {
        c = await factory.deploy(...option.args);
      }
      address = c.address;
      abi = factory.interface;
      bytecode = factory.bytecode;
    } else {
      console.log("----", option);
      let result = await hre.deployments.deploy(name, option);
      console.log((result.newlyDeployed ? "==deploy:" : "==reuse") + name);
      address = result.address;
      func = new Interface(result.abi);
      abi = result.abi;
      newly = result.newlyDeployed;
    }
    //get readable abi

    let readable = func.format("full") as string[];
    let signer = await hre.ethers.getSigner(option.from);

    //save contracts
    ContractInfo.contractnewly[name] = newly;
    let resultinfo = {
      address: address,
      abi: abi,
      func: readable,
      deployer: signer,
      bytecode: bytecode,
    };
    ContractInfo.contractinfos[name] = resultinfo;

    logtools.UpdateConfigFileName(hre);
    //log to hardhatinfo.json
    if (bytecode != null)
      logtools.SetContract(name, option.from, address, abi, readable, bytecode);

    //用xverify，不需要这个机制了
    // //gen a temp verify cmdline
    // let cmdline = "npx hardhat verify --network bscTest \"" + result.address + "\" ";
    // try {
    //     let ss = result.storageLayout["storage"][0];
    //     if (ss != undefined) {
    //         cmdline += " --contract \"" + ss["contract"] + "\"";
    //         //console.log("result:" + JSON.stringify(ss));
    //     }
    //     else {

    //         cmdline += " --contract \"" + await this.GetSolName(name) + ":" + name + "\"";

    //     }
    //     if (result.args != null) {
    //         for (var i = 0; i < result.args.length; i++) {
    //             cmdline += (" \"" + result.args[i].toString() + "\"");
    //         }
    //     }
    // }
    // catch
    // {
    //     cmdline += " --error:" + name;
    // }
    // //console.log("verifyline:" + cmdline);
    // logtools.Append(cmdline);

    return true;
  }

  private static contractnewly: { [id: string]: boolean } = {};
  private static contractinfos: {
    [id: string]: { address: Address; abi: any; func: any; deployer: Signer };
  } = {};

  private static async GetSolName(name: string): Promise<string> {
    let file1 = "contracts/" + name + ".sol";
    if (await fs.existsSync(file1)) return file1;

    var path = fs.readdirSync("contracts/");
    {
      for (var i = 0; i < path.length; i++) {
        let file2 = "contracts/" + path[i] + "/" + name + ".sol";
        if (await fs.existsSync(file2)) return file2;
      }
    }

    throw "no file:" + name;
  }
}
