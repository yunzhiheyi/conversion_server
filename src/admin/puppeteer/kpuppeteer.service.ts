import { Injectable } from '@nestjs/common';
import { InjectContext } from 'nest-puppeteer';
import vanillaPuppeteer from "puppeteer"
import qiniu from 'qiniu';
import puppeteerExtra, { addExtra } from 'puppeteer-extra';
import { cargoQueue } from 'async';
import { Logger } from '@nestjs/common';
// add stealth plugin and use defaults (all evasion techniques)
import pluginStealth from 'puppeteer-extra-plugin-stealth';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import { ToolsService } from 'src/utils/tools.service';
import { AgentModel } from 'src/models/admin/agent.model';
import { InjectModel } from 'nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import * as cheerio from 'cheerio';
import { HousingModel } from 'src/models/admin/housing.model';
import { CommunityModel } from 'src/models/admin/community.model';
import { Cluster } from 'puppeteer-cluster';
import dayjs from 'dayjs';
import FileType from 'file-type';
import fs from 'fs-extra';
import _path from 'path';
import got from 'got';
import axios from 'axios';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
import { NestjsHasherService } from '@sinuos/nestjs-hasher';
import console from 'console';
@Injectable()
export class kPuppeteerService {
  public browser: any;
  public cookies: any;
  public cluster: any;
  logger: Logger;
  qiniuToken: any;
  bucketManager: qiniu.rs.BucketManager;
  public captchaToken: Boolean = false;
  constructor(
    @InjectModel(AgentModel)
    private readonly agentModel: ReturnModelType<typeof AgentModel>,
    @InjectModel(HousingModel)
    private readonly housingModel: ReturnModelType<typeof HousingModel>,
    @InjectModel(CommunityModel)
    private readonly communityModel: ReturnModelType<typeof CommunityModel>,
    private readonly toolsService: ToolsService,
    private readonly snowflakeService: SnowflakeService,
    private readonly hasherService: NestjsHasherService
    // @InjectContext() private readonly browserContext: BrowserContext,
  ) {
    const puppeteer = addExtra(vanillaPuppeteer)
    puppeteer.use(pluginStealth())
    puppeteer.use(
      RecaptchaPlugin({
        provider: { id: '2captcha', token: '53a3c8d975ee2934cc1adbfef1f661b1' },
        visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
      })
    );
    this.logger = new Logger('kPuppeteerService')
    Cluster.launch({
      concurrency: Cluster.CONCURRENCY_PAGE,
      maxConcurrency: 100,
      retryLimit: 20,   // 重试次数
      skipDuplicateUrls: true,  // 不爬重复的url
      monitor: false,  // 显示性能消耗
      timeout: 10060000,
      puppeteer: puppeteer,
      puppeteerOptions: {
        headless: false,
        defaultViewport: null,
        ignoreHTTPSErrors: true,        // 忽略证书错误
        args: [
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-xss-auditor',    // 关闭 XSS Auditor
          '--no-zygote',
          '--allow-running-insecure-content',     // 允许不安全内容
          '--disable-webgl',
          '--disable-popup-blocking',
        ],
        ignoreDefaultArgs: ['--enable-automation'],
      },
    }).then((res) => {
      this.cluster = res;
    })
    var _this = this;
    qiniu.conf.ACCESS_KEY = 'w27Ypatv9ZGGhJ-BSRn2G40SNSuOwvpyM2--Kxsi';
    qiniu.conf.SECRET_KEY = 'U6tKLo44muMOQ-nFAN8LLP9Ut-8HY9vKIs22qKMo';
    var mac = new qiniu.auth.digest.Mac('w27Ypatv9ZGGhJ-BSRn2G40SNSuOwvpyM2--Kxsi', 'U6tKLo44muMOQ-nFAN8LLP9Ut-8HY9vKIs22qKMo');
    var config = new qiniu.conf.Config();
    config['zone'] = qiniu.zone.Zone_as0;
    _this.bucketManager = new qiniu.rs.BucketManager(mac, config);
    // var putPolicy = new qiniu.rs.PutPolicy({ scope: 'cd-brighton' });
    var putPolicy = new qiniu.rs.PutPolicy({ scope: 'kaola-app' });
    this.qiniuToken = putPolicy.uploadToken();
  }
  
  // 上传文件
  async qiniuPrameter(filePaths: string, filePathName: string) {
    const config = new qiniu.conf.Config();
    const formUploader = new qiniu.form_up.FormUploader(config);
    // key 为上传到七牛云后自定义图片的名称
    var _key = 'upload' + '/' + filePathName;
    var extra = new qiniu.form_up.PutExtra();
    return new Promise((resolve, reject) => {
      formUploader.putFile(this.qiniuToken, _key, filePaths, extra, async (err, ret) => {
        if (!err) {
          var _o = {
            hash: ret.hash,
            // url: 'https://test-cdn.resste.com/' + ret.key,
            url: 'https://cdn.resste.com/' + ret.key
          };
          // const stream = got.stream(_o.url);
          // this.logger.log('url:'+ _o.url);
          // var resStream = await FileType.fromStream(stream)
              // var isExt = resStream && resStream.ext;
          var videoFormat =['avi','mpg','mpeg','mov','flv','mp4','rmvb','m4v']
          var isExt = ret.key.replace(/.+\./, "");
          var type = (videoFormat.includes(isExt) ? 1 : isExt === 'png' || isExt === 'jpg' || isExt === 'bmp' || isExt === 'jpge' ? 2 : 4);
          // console.log('type:' + isExt +'：---'+ type);
          var _source = await this.creatSource({
            sourceId: ret.hash,
            type: type,
            // url: 'https://test-cdn.resste.com/' + ret.key 
            url: 'https://cdn.resste.com/' + ret.key
          });
          if (_source) {
            resolve(_o);
          }
        } else {
          reject(err);
        }
      });
    });
  }
  // 提交小区
  public async submitCommunity(dada: any) {
    try {
      const response = await axios({
        method: 'post',
        // url: "http://houseapp.brighton.ltd/pc/spider/submitCommunity",
        url: "http://koala.app.resste.com/pc/spider/submitCommunity",
        data: dada,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'SpiderKey': '5p9q9uqjv4s8atp.koala'
        }
      })
      if (response) {
        return response.data;
      }
    } catch (err) {
      this.logger.log('小区出现异常', err);
      return {
        code: 500,
        data: err,
        message: '小区出现异常'
      };
    }
  }

  // 设置中介头像
  public async setAgentHeadUrl(dada: any) {
    try {
      const response = await axios({
        method: 'post',
        // url: "http://houseapp.brighton.ltd/pc/spider/setAgentHeadUrl",
        url: "http://koala.app.resste.com/pc/spider/setAgentHeadUrl",
        data: dada,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'SpiderKey': '5p9q9uqjv4s8atp.koala'
        }
      })
      if (response) {
        return response.data;
      }
    } catch (err) {
      this.logger.log('设置中介头像出现异常', err);
      return {
        code: 500,
        data: err,
        message: '设置中介头像出现异常'
      };
    }
  }

  // 提交视频
  public async submitVideo(dada: any) {
    try {
      const response = await axios({
        method: 'post',
        // url: "http://houseapp.brighton.ltd/pc/spider/submitVideo",
        url: "http://koala.app.resste.com/pc/spider/submitVideo",
        data: dada,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'SpiderKey': '5p9q9uqjv4s8atp.koala'
        }
      })
      if (response) {
        return response.data;
      }
    } catch (err) {
      this.logger.log('视频出现异常', err);
      return {
        code: 500,
        data: err,
       message: '视频出现异常'
      };
    }
  }
  // 添加资源
  public async creatSource(dada: any) { 
    if (dada.type === 4) {
      dada.sourceId = await this.hasherService.hash(dada.url);
    }
    try {
      const response = await axios({
        method: 'post',
        // url: "http://houseapp.brighton.ltd/common/Files/creatSource",
        url: "http://koala.app.resste.com/common/Files/creatSource",
        data: dada,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'SpiderKey': '5p9q9uqjv4s8atp.koala'
        }
      })
      // console.log('response', response); 
      if (response) {
        return response.data;
      }
    } catch (err) {
      this.logger.log('添加资源异常', err);
      return {
        code: 500,
        data: err,
        message: '添加资源异常'
      };
    }
  }
  // 提交房源
  public async submitHouse(dada: any) {
    try {
      const response = await axios({
        method: 'post',
        // url: "http://houseapp.brighton.ltd/pc/spider/submitHouse",
        url: "http://koala.app.resste.com/pc/spider/submitHouse",
        data: dada,

        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'SpiderKey': '5p9q9uqjv4s8atp.koala'
        }
      }) 
      if (response) {
        return response.data;
      }
    } catch (err) {
      this.logger.log('出现房源异常', err);
      return {
        code: 500,
        data: err,
        message: '出现房源异常'
      };
    }
  }
  public sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async create(options: any, client:any) {
    var _this = this;
    let _index = 0;
    var isTargetUrl = options.target_url.length > 0 && options.target_url instanceof Array;
    var _length = (isTargetUrl ? options.target_url.length : 1);
    await this.cluster.task(async ({ page, data: url }) => {
      await page.goto(url, { timeout: 160000, 'waitUntil': 'networkidle0'  });
      _this.logger.log('网页加载成功...')
      var bodyContent = await page.content();
      const $b = cheerio.load(bodyContent);
      // 校验是否是验要破解验证码
      if ($b('body').hasClass('errorPage') || $b('body').hasClass('no-js')) {
        _this.logger.log('验证码加载...')
        var _resHcaptcha = null;
        console.log($b('#cf-hcaptcha-container').length);
        await page.waitForSelector('#challenge-stage', {
          timeout: 8000
        })
        if($b('#norobot-container').length > 0) {
          console.log('点击');
        }
        if ($b('#turnstile-wrapper').length > 0 || $b('#norobot-container').length > 0) {
          _this.logger.log('需要刷新...')
          await page.evaluate((el:any) => {
            location.reload();
          })
        }
        if ($b('.hcaptcha-box').length > 0) {
           _resHcaptcha = await page.waitForSelector('.hcaptcha-box', {
            timeout: 6000
          })
        }
        if ($b('#cf-hcaptcha-container').length > 0) {
           _resHcaptcha = await page.waitForSelector('#cf-hcaptcha-container', {
             timeout: 6000
          })
        }
        if (_resHcaptcha && (_resHcaptcha as HTMLElement)) {
          await page.solveRecaptchas()
          _this.logger.log('已成功破解《' + url + '》验证码...')
          client.emit('log', { event: 'log', type: 'success', data: '已成功破解《' + url + '》验证码...' });
        }
      }
      // 等待加载demo完成
      if (options.player) {
        await page.waitForSelector('#player', {
          timeout: 1600000
        });
      } else {
        await page.waitForSelector('#footer-copy', {
          timeout: 1600000
        });
      }
      await _this.sleep(500);
      var _rentContent = '';
      var _saleContent = '';
      var content = await page.$eval('body', (node: { innerHTML: any; }) => node.innerHTML)
      const $ = cheerio.load(content);
      // 执行中介详情获取房源信息
      if (options.stepsActive === 1 && $(options?.isList ? '#listings-container' : '.agent-details')) {
        var _saleRentContent = await page.$eval(options?.isList ? '#listings-container' : '.agent-details', (node: { innerHTML: any; }) => node.innerHTML);
        if (page.url().indexOf('property-for-sale') > -1) {
          _saleContent = _saleRentContent;
        } else {
          _rentContent = _saleRentContent;
        }
      }
      isTargetUrl ? _index++: (_index=1);
      _this.logger.log('目前进度' + _index + '/' + _length)
      client.emit('log', { event: 'log', type: 'loading', data: '目前进度:' + _index + '/' + _length });
      return { content: content, _rentContent, _saleContent }
    });
    let result = { content: '', _rentContent: '', _saleContent: '' }
    if (options.stepsActive === 1 && isTargetUrl) {
      await Promise.all(options.target_url.map(async (item: any) => {
        // 判断一个sale与rent
        var _resContent = await this.cluster.execute(item);
        var _isSaleContent = item.indexOf('property-for-sale') > -1 ? '_saleContent' : '_rentContent';
        result[_isSaleContent] += _resContent[_isSaleContent];
      }));
    } if (options.stepsActive === 2 && isTargetUrl) {
      // 批量获取房源信息
      await Promise.all(options.target_url.map(async (item: any) => {
        var _resContent = await this.cluster.execute(item);
        result.content += _resContent.content;
      }));
    } else if ((options.stepsActive === 1 && !isTargetUrl) || options.stepsActive === 3 || !options.stepsActive) {
      result = await this.cluster.execute(options.target_url);
    }
    console.log('result');
    isTargetUrl && (_index = 0);
    await this.cluster.idle();
    await this.cluster.close();
    return result;
  }
  // 中介列表
  async list(query: any) {
    let reg = new RegExp(query.keyword, 'i');
    let findField = {};
    if (query.keyword) {
      findField['name'] = { $regex: reg }
    }
    const options = {
      type: query['page'] ? 'page' : 'list',
      findField
    };
    return await this.toolsService.getPageList(options, this.agentModel);
  }
  // 查询中介详情
  async queryDetails(query: any) {
    const options = {
      type: query['page'] ? 'page' : 'list',
      findField: {
        agent_id: query.id,
        house_classify: query.house_classify
      },
      queryField: {
        createdAt: 0,
        updatedAt: 0
      }
    };
    return await this.toolsService.getPageList(options, this.housingModel);
  }
  // 查询中介详情
  async queryHousingDetails(query: any) {
    const result = await this.housingModel.findOne({ _id: query.id }, { __v: 0, createdAt: 0, updatedAt: 0 });
    return result;
  }

  public async resourceExists(id: any, name: any) {
    var _this = this;
    // 文件存放路径
    const UPLOAD_DIR = _path.join(__dirname, `../../public/upload/${id}/${name}`)
    var isExist = fs.existsSync(UPLOAD_DIR)
    var result = [];
    if (isExist) {
      const files = fs.readdirSync(UPLOAD_DIR);
      // this.logger.log('正在上传资源...');
      await Promise.all(files.map(async (item) => {
        var _path = UPLOAD_DIR + '/' + item;
        var qiniuResult = await _this.qiniuPrameter(_path, item);
        if (!qiniuResult || !qiniuResult['url']) {
          console.log('上传出错', qiniuResult);
        } else {
          result.push(qiniuResult);
        }
      }));
    }
    return result.map(item => item.hash);
  }
  // 下载资源
  async downloadResource(url: any, id: any, name: any) {
    var reg = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    if (!reg.test(url)) { 
      return new Promise((resolve, reject) => {
        this.logger.log('资源连接不正确...');
        resolve(true)
      });
    }
    const stream = got.stream(url);
    var resStream = stream && await FileType.fromStream(stream)

    if ((url && url.indexOf('youtube.com') > -1) || !url || !resStream) {
      return new Promise((resolve, reject) => {
        this.logger.log("【"+url+'】当前连接不能下载资源...')
        resolve(true)
      });
    }
    let timeDir = await this.snowflakeService.nextId() + '';
   
    let flieMp4Name = `${timeDir}.${resStream.ext}`;
    // 文件存放路径
    const UPLOAD_DIR = _path.join(__dirname, `../../public/upload/${id}/${name}`)
    fs.ensureDirSync(UPLOAD_DIR)
    const mp4FilePath = _path.resolve(UPLOAD_DIR, flieMp4Name);
    let writeStream = fs.createWriteStream(mp4FilePath); // 创建可写流
    const resData = await axios({ url, responseType: 'stream' })
    // 下载资源
    return new Promise((resolve, reject) => {
      if (resData) {
        resData.data.pipe(writeStream)
        writeStream.on('finish', async () => {
          resolve(true)
        })
        writeStream.on('error', () => {
          reject(false)
        })
      }
    })
  }
  // 更新资源
  async updataResource(body: any) {
    const housingResult = await this.housingModel.find({ _id: { $in: body.communityIds } }, { __v: 0, createdAt: 0, updatedAt: 0 });
    const community_id = housingResult.map(item => item.community_id)
    const communityResult = await this.communityModel.find({ _id: { $in: community_id } }, { __v: 0, createdAt: 0, updatedAt: 0 });
    await Promise.all(housingResult.map(async (item:any) => { 
        await this.download(item, 1);
    }));
    await Promise.all(communityResult.map(async (item: any) => {
        await this.download(item, 2);
    }));
    return true;
  }
  // 批理下载资源
  public async download(data: any, type: number) {
    // 将房源所有的资源放一起利于下载
    // let isAsync = null;
    const UPLOAD_DIR = _path.join(__dirname, `../../public/upload/${data[type === 1 ?'_id':'community_id']}`)
    fs.emptyDirSync(UPLOAD_DIR) // 清空数据
    if (type === 1) {
      let videoArr = data.video.filter(item => item.url.indexOf('www.youtube.com') > -1)
      let floor_pic_length = data.floor_pic.length;
      let other_pic_length = data.other_pic.length;
      let video_length = videoArr.length;
      this.logger.log('开始下载《' + data.house_name + '》所有房源资源...')
      await Promise.all(data.floor_pic.map(async (_item: any) => {
        let f = await this.downloadResource(_item, data._id, 'floor_pic')
        f && floor_pic_length--;
      }));
      await Promise.all(data.other_pic.map(async (_item: any) => {
        let o = await this.downloadResource(_item, data._id, 'other_pic')
        o && other_pic_length--;
      }));
      await Promise.all(videoArr.map(async (_item: any) => {
        let v = await this.downloadResource(_item.url, data._id, 'video')
        v && video_length--;
      }));
      // isAsync = !floor_pic_length && !other_pic_length && !video_length;
    } 
    // 将小区所有的资源放一起利于下载
    if (type === 2) { 
      let mangement_video = data.mangement_video.filter(item => item.url.indexOf('www.youtube.com') > -1)
      let mangement_pic_length = data.mangement_pic.length;
      let mangement_video_length = mangement_video.length;
      this.logger.log('开始下载《' + data.community_name +'》小区资源...')
      await Promise.all(data.mangement_pic.map(async (_item: any) => {
        let m = await this.downloadResource(_item, data.community_id, 'mangement_pic');
        m && mangement_pic_length--;
      }));
      await Promise.all(mangement_video.map(async (_item: any) => {
        let vi = await this.downloadResource(_item.url, data.community_id, 'mangement_video')
        vi && mangement_pic_length--;
      }));
      let l = await this.downloadResource(data.layout_pic, data.community_id, 'layout_pic')
      // isAsync = !mangement_pic_length && !mangement_video_length && l;
    }
    return new Promise((resolve, reject) => {
      // if (isAsync) {
        this.logger.log('《' + (type === 2 ? data.community_name : data.house_name) + '》完成资源下载')
        resolve(true)
      // }
    })
  }
  // 队列验证
  cargoQueue(body: any) {
    var queue = cargoQueue(async (tasks: any, callback: any) => {
      await Promise.all(tasks.map(async (_res: any) => {
        var _data = await this.queueInjectionTasks(_res);
        if (_data && _data.code === 200) {
          callback();
        }
      }))
    }, 1, 10);
    // add some items
    body.communityIds.map((item: any) => {
      var _res = { communityId: item, aid: body.aid, accountId: body.accountId };
      queue.push(_res, async (err) => {
        this.logger.log('【' + item + '】完成任务');
        if (body.communityIds[body.communityIds.length - 1] === item) {
          this.logger.log('最后一个已经完成任务');
        }
      });
    })
  }

  // 单个队列执行任务
  // 注入库
  async queueInjectionTasks(body: any) {
    // console.log('__body', body);
    var _this = this;
    let housingResult: any = await this.housingModel.findOne({ _id: body.communityId  }, { __v: 0, createdAt: 0, updatedAt: 0 });
    let communityResult: any = await this.communityModel.findOne({ _id: housingResult.community_id }, { __v: 0, createdAt: 0, updatedAt: 0 });
    let resCommunityData = [];
    let resHousingResult = [];
    // 开始下载中介头像
    var _agentInfo = await this.agentModel.findOne({ _id: body.aid });
    // console.log(_agentInfo);
    if (_agentInfo && !_agentInfo.photoUpdata) {
      this.logger.log('开始处理中介头像...')
      await this.downloadResource(_agentInfo.photoUrl, 'agent', _agentInfo._id)
      var photoUrl = await _this.resourceExists('agent', body.aid);
      if (photoUrl.length > 0) {
        var agentHead = await _this.setAgentHeadUrl({
          "agentId": body.accountId,
          "headUrl": photoUrl[0]
        });
        if (agentHead && agentHead.code !== 200) {
          return agentHead;
        } else {
          this.logger.log('中介头像处理完成...')
          // 更新头像
          await this.agentModel.updateMany({ _id: body.aid }, { photoUpdata: 1 });
        }
      }
    }
    this.logger.log('开始处理小区数据...')
    var mangement_pic_ids = await _this.resourceExists(communityResult.community_id, 'mangement_pic');
    var mangement_video = await _this.resourceExists(communityResult.community_id, 'mangement_video');
    var layout_pic_ids = await _this.resourceExists(communityResult.community_id, 'layout_pic');
      // 处理第三方视频连接
    await Promise.all(communityResult.mangement_video.map(async (res: any) => {
        if (res && res.url.indexOf('www.youtube.com') > -1) {
          var _res = await _this.creatSource({
            type: 4,
            url: res.url,
            min_url: res.thumbnail
          })
          _res && mangement_video.push(_res.sourceId)
        }
      }));
      this.logger.log('小区资源上传完成...')
      resCommunityData.push({
        agentId: body.accountId,
        add_detail: communityResult.add_detail || 'N/A',
        add_post: communityResult.add_post || 'N/A',
        add_one: Number(communityResult.add_one?.value),
        add_two: Number(communityResult.add_two?.value),
        add_three: Number(communityResult.add_three?.value),
        architect: communityResult.architect,
        bulid_year: Number(communityResult.bulid_year) || 0,
        buliding_pic: communityResult.buliding_pic,
        buliding_video: communityResult.buliding_video,
        community_name: communityResult.community_name,
        community_setting: communityResult.community_setting.length > 0 ? communityResult.community_setting : ['Car Park'],
        floor_size: communityResult.floor_size,
        household: communityResult.household === 'N/A' || !communityResult.household ? 0 : Number(communityResult.household),
        layout_pic: layout_pic_ids.length > 0 && layout_pic_ids instanceof Array ? layout_pic_ids[0] : '',
        loc_lat: communityResult.loc_lat,
        loc_lng: communityResult.loc_lng,
        mangement_pic: mangement_pic_ids, // 资源
        mangement_video: mangement_video, // 资源
        setting_pic: [],
        setting_video: [],
        spider_community_id: communityResult._id,
        surrounding_pic: [],
        surrounding_video: [],
        tenure: communityResult.tenure.value,
        type_one: Number(communityResult.type_one.value),
        type_two: Number(communityResult.type_two.value),
        type_three: Number(communityResult.type_three.value),
      })
    const resCommunity = await this.submitCommunity(resCommunityData);
    if (resCommunity && resCommunity.code !== 200) {
      return resCommunity;
    }
    this.logger.log('开始注入房源数据...')
      var community = resCommunity && resCommunity.data.length > 0 && resCommunity.data.find((_res: { spider_community_id: String; }) => _res.spider_community_id === housingResult.community_id)
    var other_pic_ids = await _this.resourceExists(housingResult._id, 'other_pic');
    var floor_pic_ids = await _this.resourceExists(housingResult._id, 'floor_pic');
    var video_ids = await _this.resourceExists(housingResult._id, 'video');
      // 处理第三方视频连接
    await Promise.all(housingResult.video.map(async (res: any) => {
        if (res && res.url.indexOf('www.youtube.com') > -1) {
          var _res = await _this.creatSource({
            type: 4,
            url: res.url,
            min_url: res.thumbnail
          })
          _res && video_ids.push(_res.data.sourceId);
        }
      }));
      this.logger.log('房源资源上传完成...')
      let houseItem: any = {}
      houseItem = {
        account_id: body.accountId,
        add_detail: housingResult.add_detail || 'N/A',
        add_post: housingResult.add_post || 'N/A',
        add_one: !housingResult.add_one ? 17020001 : Number(housingResult.add_one?.value),
        add_two: !housingResult.add_two ? 17020001 : Number(housingResult.add_two?.value),
        add_three: !housingResult.add_three ? 17020001 : Number(housingResult.add_three?.value),
        architect: housingResult.architect,
        bulid_year: Number(housingResult.bulid_year) || 0,
        community_labels: housingResult.community_labels,
        description: housingResult.house_describe_html,
        community_id: community ? community?.community_id : 0,
        spider_house_id: housingResult._id,
        floor_size: housingResult.floor_size === 'N/A' || !housingResult.floor_size ? 0 : Number(housingResult.floor_size),
        land_size: housingResult.land_size,
        furniture_labels: housingResult.house_furniture,
        house_labels: housingResult.house_classify !== 'new' ? ['Good vision'] : [], // 不是新房给默认视野开阔
        loc_lat: housingResult.loc_lat,
        loc_lng: housingResult.loc_lng,
        house_bath: Number(housingResult.house_bath) || 0,
        house_bed: Number(housingResult.house_bed) || 0,
        house_hall: Number(housingResult.house_hall) || 0,
        house_classify: housingResult.house_classify === 'rent' ? 17010003 : housingResult.house_classify === 'new' ? 17010001 : housingResult.house_classify === 'sale' ? 17010002 : 17010001,
        house_describe: '', //item.house_describe
        spider_community_id: housingResult._id,
        house_level: housingResult.house_level === 'N/A' || !housingResult.house_level ? 17020001 : housingResult.house_level?.value,
        house_name: housingResult.house_name,
        house_state: 13000010,
        house_vr: housingResult.house_vr[0] || '',
        tenure: housingResult.tenure === 'N/A' || !housingResult.tenure ? 17020001 : housingResult.tenure?.value,
        floor_pic: floor_pic_ids, // 资源 
        main_pic: other_pic_ids.length > 0 ? [other_pic_ids[0]] : [],  // 资源 
        other_pic: other_pic_ids, // 资源
        video: video_ids, // 资源 
        price: housingResult.price,
        unit_price: housingResult.unit_price || 0,
        move_in: new Date().getTime(),
        type_one: !housingResult.type_one ? 17020001 : housingResult.type_one?.value,
        type_two: !housingResult.type_two ? 17020001 : housingResult.type_two?.value,
        type_three: !housingResult.type_three ? 17020001 : housingResult.type_three?.value,
      }
      if (houseItem.house_classify === 17010002) {
        houseItem.rent = housingResult.rent;
      }
      if (houseItem.house_classify === 17010003) {
        houseItem.furniture = housingResult.furniture
      }
      resHousingResult.push(houseItem);
    const resHouse = await this.submitHouse(resHousingResult);
    if (resHouse && resHouse.code === 200) {
      // this.logger.log('处理完成...')
      await this.housingModel.updateMany({ _id: { $in: body.communityId } }, { $set: { state: 3 } });
    } else {
      this.logger.log(resHouse)
      return resHouse
    }
    return resHouse
  }

  // 注入库
  async injectionKaolaSql(body: any) {
    // console.log('body', body);
    var _this = this;
    const housingResult = await this.housingModel.find({ _id: { $in: body.communityIds } }, { __v: 0, createdAt: 0, updatedAt: 0 });
    const community_id = housingResult.map(item => item.community_id)
    const communityResult = await this.communityModel.find({ _id: { $in: community_id } }, { __v: 0, createdAt: 0, updatedAt: 0 });
    const resCommunityData = [];
    const resHousingResult = [];
    // 开始下载中介头像
    var _agentInfo = await this.agentModel.findOne({ _id: body.aid });
    // console.log(_agentInfo);
    if (_agentInfo && !_agentInfo.photoUpdata) {
      this.logger.log('开始处理中介头像...')
      await this.downloadResource(_agentInfo.photoUrl, 'agent', _agentInfo._id)
      var photoUrl = await _this.resourceExists('agent', body.aid);
      if (photoUrl.length > 0) {
        var agentHead = await _this.setAgentHeadUrl({
          "agentId": body.accountId,
          "headUrl": photoUrl[0]
        });
        if (agentHead && agentHead.code !== 200) {
          return agentHead;
        } else {
          this.logger.log('中介头像处理完成...')
          // 更新头像
          await this.agentModel.updateMany({ _id: body.aid }, { photoUpdata: 1 });
        }
      }
    }
    this.logger.log('开始处理小区数据...')
    await Promise.all(communityResult.map(async (item) => {
      var mangement_pic_ids = await _this.resourceExists(item.community_id, 'mangement_pic');
      var mangement_video = await _this.resourceExists(item.community_id, 'mangement_video');
      var layout_pic_ids = await _this.resourceExists(item.community_id, 'layout_pic');
      // 处理第三方视频连接
      await Promise.all(item.mangement_video.map(async (res: any) => {
        if (res && res.url.indexOf('www.youtube.com') > -1) {
         var _res = await _this.creatSource({
           type: 4,
           url: res.url,
           min_url: res.thumbnail
         })
         _res && mangement_video.push(_res.sourceId)
        }
      }));
      this.logger.log('小区资源上传完成...')
      resCommunityData.push({
        agentId: body.accountId,
        add_detail: item.add_detail || 'N/A',
        add_post: item.add_post || 'N/A',
        add_one: Number(item.add_one?.value),
        add_two: Number(item.add_two?.value),
        add_three: Number(item.add_three?.value),
        architect: item.architect,
        bulid_year: Number(item.bulid_year) || 0,
        buliding_pic: item.buliding_pic,
        buliding_video: item.buliding_video,
        community_name: item.community_name,
        community_setting: item.community_setting,
        floor_size: item.floor_size,
        household: item.household === 'N/A' || !item.household ? 0 : Number(item.household),
        layout_pic: layout_pic_ids.length > 0 && layout_pic_ids instanceof Array ? layout_pic_ids[0]: '',
        loc_lat: item.loc_lat,
        loc_lng: item.loc_lng,
        mangement_pic: mangement_pic_ids, // 资源
        mangement_video: mangement_video, // 资源
        setting_pic: [],
        setting_video: [],
        spider_community_id: item._id,
        surrounding_pic: [],
        surrounding_video: [],
        tenure: item.tenure.value,
        type_one: Number(item.type_one.value),
        type_two: Number(item.type_two.value),
        type_three: Number(item.type_three.value),
      })
    }))
    // console.log(resCommunityData);
    const resCommunity = await this.submitCommunity(resCommunityData);
    if (resCommunity && resCommunity.code !== 200) {
      return resCommunity;
    }
    this.logger.log('开始注入房源数据...')
    await Promise.all(housingResult.map(async (item) => {
      var community = resCommunity && resCommunity.data.length > 0 && resCommunity.data.find((_res: { spider_community_id: String; }) => _res.spider_community_id === item.community_id)
      var other_pic_ids = await _this.resourceExists(item._id, 'other_pic');
      var floor_pic_ids = await _this.resourceExists(item._id, 'floor_pic');
      var video_ids = await _this.resourceExists(item._id, 'video');
      // 处理第三方视频连接
      await Promise.all(item.video.map(async (res: any) => {
        if (res && res.url.indexOf('www.youtube.com') > -1) {
         var _res = await _this.creatSource({
            type: 4,
           url: res.url,
           min_url: res.thumbnail
         })
          _res && video_ids.push(_res.data.sourceId);
        }
      }));
      this.logger.log('房源资源上传完成...')
      let houseItem:any = {}
      houseItem = {
        account_id: body.accountId,
        add_detail: item.add_detail || 'N/A',
        add_post: item.add_post || 'N/A',
        add_one: !item.add_one ? 17020001 : Number(item.add_one?.value),
        add_two: !item.add_two ? 17020001 : Number(item.add_two?.value),
        add_three: !item.add_three ? 17020001 : Number(item.add_three?.value),
        architect: item.architect,
        bulid_year: Number(item.bulid_year) || 0,
        community_labels: item.community_labels,
        description: item.house_describe_html,
        community_id: community ? community?.community_id : 0,
        spider_house_id: item._id,
        floor_size: item.floor_size === 'N/A' || !item.floor_size ? 0 : Number(item.floor_size),
        land_size: item.land_size,
        furniture_labels: item.house_furniture,
        house_labels: item.house_classify !== 'new' ? ['Good vision'] : [], // 不是新房给默认视野开阔
        loc_lat: item.loc_lat,
        loc_lng: item.loc_lng,
        house_bath: Number(item.house_bath) || 0,
        house_bed: Number(item.house_bed) || 0,
        house_hall: Number(item.house_hall) || 0,
        house_classify: item.house_classify === 'rent' ? 17010003 : item.house_classify === 'new' ? 17010001 : item.house_classify === 'sale' ? 17010002 : 17010001,
        house_describe: '', //item.house_describe
        spider_community_id: item._id,
        house_level: item.house_level === 'N/A' || !item.house_level ? 17020001 : item.house_level?.value,
        house_name: item.house_name,
        house_state: 13000010,
        house_vr: item.house_vr[0] || '',
        tenure: item.tenure === 'N/A' || !item.tenure ? 17020001 : item.tenure?.value,
        floor_pic: floor_pic_ids, // 资源 
        main_pic: other_pic_ids.length > 0 ? [other_pic_ids[0]] : [],  // 资源 
        other_pic: other_pic_ids, // 资源
        video: video_ids, // 资源 
        price: item.price,
        unit_price: item.unit_price || 0,
        move_in: new Date().getTime(),
        type_one: !item.type_one ? 17020001 : item.type_one?.value,
        type_two: !item.type_two ? 17020001 : item.type_two?.value,
        type_three: !item.type_three ? 17020001 : item.type_three?.value,
      }
      if (houseItem.house_classify === 17010002) {
        houseItem.rent = item.rent;
      }
      if (houseItem.house_classify === 17010003) {
        houseItem.furniture = item.furniture
      }
      resHousingResult.push(houseItem);
    }));
    // console.log(resHousingResult)
    const resHouse = await this.submitHouse(resHousingResult);
    if (resHouse && resHouse.code === 200) {
      this.logger.log('处理完成...')
      await this.housingModel.updateMany({ _id: { $in: body.communityIds } }, { $set: { state: 3 } });
    } else {
      this.logger.log(resHouse)
      return resHouse
    }
    return resHouse
  }
}

  // await this.sleep(2000)
  // // 有rent按钮的时候才执行
        // if ($('button[data-automation-id="active-listings-btn-listing-type-rent"]').hasClass('btn-param')) {
        //   await page.evaluate((el) => {
        //     var _button = document.querySelector('button[data-automation-id="active-listings-btn-listing-type-rent"]') as HTMLElement
        //     _button.click()
        //   })
        //   await _this.sleep(1000)
        //   _rentContent = await page.$eval('.carousel-container', (node: { innerHTML: any; }) => node.innerHTML);
        // }
  // await page.waitForNavigation({ timeout: 2000 })
  // 获取cookie 
  // this.cookies = await page.cookies();
  // await page.click('.showWhenNotAuthenticated a.navbar-button.hidden-xs')
  // const userInput = await page.$('.generic-input');
  // await userInput.type('348872111@qq.com', { delay: 400 });
  // await page.waitForSelector('.generic-input-btn');
  // const genericInputBtn = await page.$('.generic-input-btn');
  // genericInputBtn.click();
  // 99.co规则
  // const pageTel = await page.$('._3aKUU');
  // pageTel.click();
  // await page.waitForSelector('._2R8dw ._3aKUU', {
  //   hidden: true,
  // });
  // page.close();