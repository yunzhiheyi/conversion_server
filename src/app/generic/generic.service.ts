import { Injectable } from '@nestjs/common';
import * as tencentcloud from "tencentcloud-sdk-nodejs"
import { ToolsService } from '../../utils/tools.service';
import { PriceModel } from '../../models/admin/price.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import _path from 'path';
import fs from 'fs-extra';
import { AppConversion } from 'src/models/app/conversion.model';
import { QiniuService } from 'src/utils/qiniu.service';
@Injectable()
export class GenericService {
  constructor(
    @InjectModel(AppConversion)
    private readonly appConversion: ReturnModelType<typeof AppConversion>,
    @InjectModel(PriceModel)
    private readonly priceModel: ReturnModelType<typeof PriceModel>,
    private readonly qiniuUpload: QiniuService,
    private readonly toolsService: ToolsService,
  ) { }
  // 处理腾讯短信验证码
  async tencentSMS(smsType: number, mobile: any, code: string) {
    console.log('------', smsType, mobile, code)
    const CvmClient = tencentcloud.sms.v20210111.Client;
    // 导入对应产品模块的client models。
    // 实例化要请求产品(以cvm为例)的client对象
    let client = new CvmClient({
      // 腾讯云认证信息
      credential: {
        secretId: "AKIDjIbdQyKRQGtHPK2VjhPt9ByVnrfDVXKr",
        secretKey: "JNBj26uSq1wb0EYotiHbgV5RYP0MSIuH",
      },
      // 产品地域
      region: "ap-guangzhou",
      // 可选配置实例
      profile: {
        signMethod: "TC3-HMAC-SHA256", // 签名方法
        httpProfile: {
          reqMethod: "POST", // 请求方法
          reqTimeout: 30, // 请求超时时间，默认60s
          endpoint: "sms.tencentcloudapi.com"
        },
      },
    })
    const params = {
      /* 短信应用ID: 短信SmsSdkAppId在 [短信控制台] 添加应用后生成的实际SmsSdkAppId，示例如1400006666 */
      SmsSdkAppId: "1400605519",
      SignName: smsType == 1 ? "云智合一" : '',
      /* 短信码号扩展号: 默认未开通，如需开通请联系 [sms helper] */
      ExtendCode: "",
      /* 国际/港澳台短信 senderid: 国内短信填空，默认未开通，如需开通请联系 [sms helper] */
      SenderId: "",
      /* 用户的 session 内容: 可以携带用户侧 ID 等上下文信息，server 会原样返回 */
      SessionContext: "",
      PhoneNumberSet: ["+86" + mobile],
      /* 模板 ID: 必须填写已审核通过的模板 ID。模板ID可登录 [短信控制台] 查看 */
      TemplateId: "1223951",
      /* 模板参数: 若无模板参数，则设置为空*/
      TemplateParamSet: [code, "5"],
    }
    // 通过client对象调用想要访问的接口，需要传入请求对象以及响应回调函数
    return await client.SendSms(params)
  }
  // 查询价格
  async priceList() {
    return await this.priceModel.find({}, { _id: 0 }).sort({ sort: 1 });
  }
  uploadFile(rawBody: any) {
    console.log(rawBody);
  }
  // 生成文档
  async officegenWord(_id: any) {
    // 文件存放路径
    const UPLOAD_WORD_DIR = _path.join(__dirname, '../../public/word/');
    const fileName = new Date().getTime() + '.docx';
    const txtPath = _path.resolve(UPLOAD_WORD_DIR, fileName);
    var _res = await this.appConversion.findOne({ _id });
    var _text = '';
    _res.taskDetailed.map((item) => {
      _text += item['text'] + '\n\n';
    })
    if (!_text) {
      return false;
    }
    // 生成目录
    fs.ensureDirSync(UPLOAD_WORD_DIR);
    try {
      fs.writeFileSync(txtPath, _text);
      // 将音频提交到七牛云
      var result = await this.qiniuUpload.qiniuPrameter(
        txtPath,
        'word',
        fileName,
      );
      if (!result || !result['url']) {
        return {
          code: 3, // 上传封面到七牛云出错
          data: false
        }
      } else {
        var _resData = await this.appConversion.updateMany({ _id }, { $set: { wordUrl: result['url'] } });
        fs.removeSync(txtPath);
        if (_resData) {
          return {
            code: 1,
            data: result['url']
          }
        }
      }
    } catch (err) {
      return {
        data: err,
        code: 3 // 上传封面到七牛云出错
      }
    }
  }
}
