import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  // WsResponse,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
import axios from 'axios';
import got from 'got';
import fs from 'fs-extra';
import _path from 'path';
import FileType from 'file-type';
import * as WebSocket from 'ws';
import { Server } from 'socket.io';
import * as cheerio from 'cheerio';
import { kPuppeteerService } from '../puppeteer/kpuppeteer.service';
import { AgentModel } from 'src/models/admin/agent.model';
import { InjectModel } from 'nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { HousingModel } from 'src/models/admin/housing.model';
import { CommunityModel } from 'src/models/admin/community.model';
import { ToolsService } from 'src/utils/tools.service';
import { cargoQueue } from 'async';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;
  logger: Logger;
  areaScreen: Array<any> = [];
  subwayScreen: Array<any> = [];
  constructor(
    @InjectModel(AgentModel)
    private readonly _agentModel: ReturnModelType<typeof AgentModel>,
    @InjectModel(HousingModel)
    private readonly _housingModel: ReturnModelType<typeof HousingModel>,
    @InjectModel(CommunityModel)
    private readonly _communityModel: ReturnModelType<typeof CommunityModel>,
    private readonly _kPuppeteerService: kPuppeteerService,

    private readonly snowflakeService: SnowflakeService,
    private readonly toolsService: ToolsService,
  ) {
    this.logger = new Logger('kPuppeteerController')
    this.getQueryAreaScreen().then((response) => {
      this.areaScreen = [response.data[0]];
    });
  }
  // 通过地址获取区域
  public async getGeocode(_latlng: String) {
    try {
      let response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + _latlng + '&key=AIzaSyAmEGzQOpxsJ71r6Vu4LwUims3JMWnpbVA');
      var _neighborhood = response.data.results[0].address_components.filter((item: any) => item.types.includes('neighborhood'));
      // console.log(_neighborhood);
      return _neighborhood[0]?.long_name;
    } catch (err) {
      this.logger.log('区域出现异常', err);
    }
  }
  // 获取小区区域
  public async getQueryAreaScreen() {
    let response = await axios.get('http://houseapp.brighton.ltd/app/screenDeal/queryAreaScreen');
    return response.data;
  }
  // 获取中介信息
  public async getAgentsInfo(data: any, client: any) {
    var _this = this;
    this.logger.log('正在获取中介列表信息...')
    client.emit('log', { event: 'log', type: 'loading', data: '正在获取中介列表信息...' });
    var resContent = await this._kPuppeteerService.create(data.options, client);
    const $ = cheerio.load(resContent.content);
    let agentListContent = []
    var agentList = $('.main-content .agent-list').find('.agent-card');
    agentList.each(function (i, elem) {
      var _impression = JSON.parse($(this).attr('data-ec-impression'));
      var _agentPhoto = $(this).find('.agent-photo img').attr('data-original'); // 头像
      var agentId = _impression.productData.id + '';
      // 插入列表数据
      var _item = {
        _id: agentId,
        name: _impression.productData.name,
        description: _impression.productData.brand,
        photoUrl: _agentPhoto,
        url: 'https://www.propertyguru.com.sg' + $(this).find('.agent-info-name a').attr('href'),
        houseUrl: [],
        tel: '',
        sale: '',
        rent: '',
        ceaNo: '',
        licenseNo: ''
      }

      agentListContent.push(_item)
    })
    client.emit('log', { event: 'log', type: 'success', data: '中介列表获取成功...' });
    return agentListContent;
  }
  // 获取类型
  public getPropertyType(value: any) {
    var _type_three_value = value.split(',');
    var _hindex = _type_three_value.findIndex((item: string) => item === 'HDB');
    var _findex = _hindex > -1 ? _hindex : _type_three_value.findIndex((item: string) => item === 'For');
    var _type_threeValue = '';
    _type_three_value.filter((item: string, index: number) => {
      if (index < _findex) {
        _type_threeValue += ' ' + item;
      }
    })
    return _type_threeValue;
  }
  public findDetailsInfo(arr: any, key: any) {
    var _arrFind = arr.find((item: any) => item.name === key);
    return _arrFind ? _arrFind.value : 'N/A'
  }
  // 获取房源详情
  public async getHousingDetails(data: any, client: any) {
    var resContent = await this._kPuppeteerService.create(data, client);
    const $ = cheerio.load(resContent.content);
    var _this = this;
    var resData = []; // 结果
    var _$this = $('.contents-listing-detail')
    var other_pic = []; // 房源图片
    var imgFloor = [];// 平面图片
    var videoUrl = []; // 视频地址
    var house_furniture = [];
    var community_labels = [];
    var house_vr = [];
    var details = []; // 详细信息
    var latitude = _$this.find('#map-accordion meta[itemprop="latitude"]').attr('content');
    var longitude = _$this.find('#map-accordion meta[itemprop="longitude"]').attr('content');
    // 图片资源
    _$this.find('.carousel-inner.infinite .item-img').each(function (i, elem) {
      var _src = $(this).find('img')
      var _imgStr = !_src.attr('data-original') ? _src.attr('src') : _src.attr('data-original')
      if (!$(this).hasClass('imgFloor')) {
        _imgStr && other_pic.push(_imgStr);
      } else {
        _imgStr && imgFloor.push(_imgStr);
      }
    });
    _$this.find('#facilities .expansible').each(function (i, elem) {
      var _li = $(this).find('li[itemprop="amenityFeature"]');
      var isKeyFeatures = $(this).find('.card__title').text().indexOf('Key Features') > -1;
      var isFacilities = $(this).find('.card__title').text().indexOf('Facilities') > -1;
      if (isKeyFeatures) {
        _li.each(function (i, elem) {
          house_furniture.push($(this).find('[itemprop="name"]').text())
        });
      }
      if (isFacilities) {
        _li.each(function (i, elem) {
          community_labels.push($(this).find('[itemprop="name"]').text())
        });
      }
    })
    // 视频连接
    _$this.find('.item-mp4.vid').each(function (i, elem) {
      var _video = $(this).find('.gallery-item.video video')
      var _vsrc = _video.children().attr('src');
      _vsrc && videoUrl.push({ url: _vsrc, thumbnail: '' });
    });
    _$this.find('.item-htm.vid').each(function (i, elem) {
      var _iframe = $(this).find('.gallery-item.video iframe')
      var _fsrc = _iframe.attr('src')
      _fsrc && videoUrl.push({ url: _fsrc, thumbnail: '' });
    });
    // VR
    _$this.find('.item-htm-vt.vt').each(function (i, elem) {
      var _iframe = $(this).find('.gallery-item.video iframe')
      var _src_vr = _iframe.attr('src');
      _src_vr && house_vr.push(_src_vr);
    });
    // 获取所有的信息
    _$this.find('.table-row tbody tr').each(function (i, elem) {
      details.push({ name: $(this).find('td[itemprop="name"]').children().text(), value: $(this).find('td[itemprop="value"]').text() });
    });
    var _type_three = _this.findDetailsInfo(details, 'Property Type').replace(/^\s+|\s+/g, ",");
    var _type_threeValue = _this.getPropertyType(_type_three);
    var isRoom = _$this.find('[itemprop="numberOfRooms"]').text() === "Room";
    var resDataList: any = {
      _id: _$this.find('[data-listing-id]').first().attr('data-listing-id'),
      house_name: _$this.find('div.listing-title.text-transform-none').text(),
      price: _$this.find('.listing-detail-summary-bar-price .price').attr('content'),
      unit_price: _$this.find('.property-info-element.psf .price-value').text().replace(/\s*/g, "").replace(/\s*,\s*/, ''),
      main_pic: other_pic[0],
      other_pic: other_pic.filter((item, index) => index > 0),
      floor_pic: imgFloor,
      video: videoUrl,
      add_one: null,
      add_two: null,
      add_three: null,
      type_one: null,
      type_two: null,
      type_three: _type_threeValue.replace(/^\s*|\s*$/g, ''),
      house_bed: isRoom ? 1 : _$this.find('.property-info-element.beds').text().replace(/\s*/g, "").replace(/\n/g, ''),
      house_bath: _$this.find('.property-info-element.baths').text().replace(/\s*/g, "").replace(/\n/g, ''),
      land_size: _this.findDetailsInfo(details, 'Land Size'),
      loc_lng: longitude || 0,
      loc_lat: latitude || 0,
      bulid_year: _$this.find('.condo-profile-box__project-info .property-attr').first().find('.value-block').text().replace(/\s*/g, ""),
      house_vr: house_vr,
      floor_size: _$this.find('.property-info-element.area meta[itemprop="value"]').attr('content'),
      house_level: _this.findDetailsInfo(details, 'Floor Level'),
      add_detail: _$this.find('span[itemprop="streetAddress"]').text(),
      add_post: _$this.find('span[itemprop="postalCode"]').text(),
      tenure: _this.findDetailsInfo(details, 'Tenure'),
      furniture: _this.findDetailsInfo(details, 'Furnishing') === 'Fully Furnished' ? 17012002 : _this.findDetailsInfo(details, 'Furnishing') === 'Partially Furnished' ? 17012001 : 17012003,
      architect: _this.findDetailsInfo(details, 'Developer'),
      house_describe_html: _$this.find('.listing-details-text').html().replace(/<h3[^>]*>[^<]*<\/h3>/gi, '').replace(/<a[^>]*>[^<]*<\/a>/gi, '').replace(/\n/g, '').replace(/ (^\s*)|(\s * $)/g, ""),
      house_describe: _$this.find('.listing-details-text').html().replace(/<h3[^>]*>[^<]*<\/h3>/gi, '').replace(/<br\/>/g, "\n").replace(/<\/?.+?\/?>/g, '').replace(/ (^\s*)|(\s * $)/g, ""),
      house_furniture: house_furniture,
      community_labels: community_labels,
      rent: _this.findDetailsInfo(details, 'Currently Tenanted') === 'NO' ? 17011002 : 17011001,
      community_id: _$this.find('#condo-widget_condo_url').attr('href') || ''
    }
    // 合租
    if (isRoom) {
      resDataList.house_classify = 'room';
    }
    return resDataList
  }
  // 获取中介详情信息
  public async getAgentDetails(data: any, client: any) {
    var resContent = await this._kPuppeteerService.create(data, client);
    const $ = cheerio.load(resContent.content);
    var _agentPhoto = $('div[data-automation-id="agent-detail-photo"]').find('img').attr('data-original'); // 头像
    var _agentId = _agentPhoto?.match(/\agent\/.*?(\/)/g)[0].replace(/[^\d.]/g, '')
    var _sale = $('[data-automation-id="stat-listings-for-sale"]').text();
    var _rent = $('[data-automation-id="stat-listings-for-rent"]').text();
    var _salePage = Math.ceil(parseInt(_sale) / 20); // 在售
    var _rentPage = Math.ceil(parseInt(_rent) / 20); // 在租
    var houseUrl = [];

    // 获取分页数据连接
    for (let i = 1; i <= _salePage; i++) {
      houseUrl.push('https://www.propertyguru.com.sg/property-for-sale/' + i + '?agent_id=' + _agentId)
    }
    for (let i = 1; i <= _rentPage; i++) {
      houseUrl.push('https://www.propertyguru.com.sg/property-for-rent/' + i + '?agent_id=' + _agentId)
    }
    // 手机号和国家代码
    var mobileArr = $('[data-automation-id="contact-form-agent-mobile"]').last().text().split(' ');
    var mobile = '';
    mobileArr.forEach((item, index) => {
      if (index > 0) {
        mobile += item;
      }
    })
    var resData = {
      _id: _agentId,
      name: $('.agent-fullname').text(),
      description: $('.agency-logo img').attr('alt'),
      photoUrl: _agentPhoto,
      houseUrl: houseUrl,
      mobile: mobile,
      sale: _sale,
      rent: _rent,
      url: data.target_url,
      countryCode: parseInt(mobileArr[0]) + '',
      ceaNo: $('[data-automation-id="agent-detail-agent-license-formatted"]').text(),
      licenseNo: $('[data-automation-id="agent-detail-agency-license-formatted"]').text()
    }
    return resData;
  }
  // 获取中介房源信息
  public async getAgentHouseList(data: any, client: any, _agentId: any) {
    var resContent = await this._kPuppeteerService.create(data, client);
    const $rent = cheerio.load(resContent._rentContent);
    const $sale = cheerio.load(resContent._saleContent);
    var rent = [];
    var sale = [];
    var rentUrl = [];
    var saleUrl = [];
    $rent('.listing-card').each(function (i, elem) {
      var _this = $rent(this);
      var _alink = _this.find('a.nav-link');
      var _id = _this.attr('data-listing-id');
      var _imgStr = _this.find('img[itemprop="thumbnailUrl"]').first();
      var main_pic = _imgStr.attr('src').indexOf('https') > -1 ? _imgStr.attr('src') : _imgStr.attr('data-original')
      var _item = {
        _id,
        url: _alink.attr('href'),
        main_pic: main_pic,
        house_name: _alink.attr('title').split('-')[1],
        house_bed: _this.find('.listing-rooms .bed').text().replace(/\s*/g, ""),
        house_bath: _this.find('.listing-rooms .bath').text().replace(/\s*/g, ""),
        agent_id: _agentId + '',
        price: _this.find('.list-price .price').text().replace(/[^0-9]/ig, ''),
        house_classify: 'rent'
      }
      rentUrl.push(_item.url);
      rent.push(_item);
    })
    $sale('.listing-card').each(function (i, elem) {
      var _this = $sale(this);
      var _alink = _this.find('a.nav-link');
      var _id = _this.attr('data-listing-id');
      var _imgStr = _this.find('img[itemprop="thumbnailUrl"]').first();
      var main_pic = _imgStr.attr('src').indexOf('https') > -1 ? _imgStr.attr('src') : _imgStr.attr('data-original')
      var _item = {
        _id,
        url: _alink.attr('href'),
        main_pic: main_pic,
        house_name: _alink.attr('title').split('-')[1],
        price: _this.find('.list-price .price').text().replace(/[^0-9]/ig, ''),
        house_bed: _this.find('.listing-rooms .bed').text().replace(/\s*/g, ""),
        house_bath: _this.find('.listing-rooms .bath').text().replace(/\s*/g, ""),
        agent_id: _agentId + '',
        house_classify: _this.find('.new-launch').hasClass('new-launch') ? 'new' : 'sale'
      }
      saleUrl.push(_item.url);
      sale.push(_item);
    })
    return { sale, rent, saleUrl, rentUrl }
  }
  // 获取小区信息
  public async getHouseCommunity(data: any, client: any, house: any, account_id: any) {
    var resContent = await this._kPuppeteerService.create(data, client);
    const $ = cheerio.load(resContent.content);
    var other_pic = []; // 房源图片
    var imgFloor = [];// 平面图片
    var videoUrl = []; // 视频地址
    var community_setting = []; // 配套
    var resData = {}; // 结果
    // 任期
    var tenure = this.toolsService.getTenure($('.table-row .col-xs-12:nth-child(4) .value-block').text());
    $('.carousel-inner.infinite .item-img').each(function (i, elem) {
      var _src = $(this).find('img')
      var _imgStr = !_src.attr('data-original') ? _src.attr('src') : _src.attr('data-original')
      if (!$(this).hasClass('imgFloor')) {
        _imgStr && other_pic.push(_imgStr);
      } else {
        _imgStr && imgFloor.push(_imgStr);
      }
    });
    // 户型特点
    $('.expansible.compacted.card li[itemprop="amenityFeature"]').each(function (i, elem) {
      community_setting.push($(this).find('[itemprop="name"]').text())
    })
    // 视频连接
    $('.item-mp4.vid').each(function (i, elem) {
      var _video = $(this).find('.gallery-item.video video')
      var _vsrc = _video.children().attr('src');
      _vsrc && videoUrl.push({ url: _vsrc, thumbnail: '' });
    });
    $('.item-htm.vid').each(function (i, elem) {
      var _iframe = $(this).find('.gallery-item.video iframe')
      var _fsrc = _iframe.attr('src')
      _fsrc && videoUrl.push({ url: _fsrc, thumbnail: '' });
    });
    var details = [];
    let community_id = await this.snowflakeService.nextId() + '';
    // 获取所有的信息
    $('.table-row tbody tr').each(function (i, elem) {
      details.push({ name: $(this).find('td[itemprop="name"]').children().text(), value: $(this).find('td[itemprop="value"]').text() });
    });
    var house_vr = [];
    var tenure = this.toolsService.getTenure(this.findDetailsInfo(details, 'Tenure'));
    $('.carousel-inner.infinite .item-img').each(function (i, elem) {
      // VR
      if ($(this).hasClass('vt')) {
        $(this).find('.gallery-item.video iframe').each(function (i, elem) {
          var _src_vr = $(this).attr('src');
          _src_vr && house_vr.push(_src_vr);
        });
      }
    });
    resData = {
      _id: house.community_id,
      community_id: community_id,
      community_name: this.findDetailsInfo(details, 'Project Name'),
      mangement_pic: other_pic,
      layout_pic: other_pic[0],
      video: videoUrl,
      add_detail: house.add_detail,
      add_post: house.add_post,
      community_setting: community_setting,
      add_one: house.add_one,
      add_two: house.add_two,
      add_three: house.add_three,
      type_one: house.type_one,
      type_two: house.type_two,
      type_three: house.type_three,
      house_vr: house_vr,
      tenure: tenure,
      household: this.findDetailsInfo(details, 'Total Units'),
      loc_lng: $('#map meta[itemprop="longitude"]').attr('content') || 0,
      loc_lat: $('#map meta[itemprop="latitude"]').attr('content') || 0,
      floor_size: house.land_size,
      bulid_year: this.findDetailsInfo(details, 'Completion Year'),
      architect: this.findDetailsInfo(details, 'Developer'),
      account_id: account_id
    }
    return resData;
  }
  // 获取第三方视频连接缩略图
  public async getVideoThumbnail(data: any, client: any) {
    var resContent = await this._kPuppeteerService.create(data, client);
    const $ = cheerio.load(resContent.content);
    var _str = $('.ytp-cued-thumbnail-overlay').children().attr('style');
    var _thumbnailUrl = _str && _str.match(/\s*["']?([^"'\r\n\)\(]+)["']?\s*/gi)[1].replace(/["]+/gi, "");
    return _thumbnailUrl || '';
  }
  // 获取中介信息
  public async getAgentData(data: any, client: any) {
    var agentDetails = null;
    var agentHouseList = null;
    var _ainfo = null
    var _agentInfo = null;
    // 状态为0的时候才需要补充中介信息
    _agentInfo = await this._agentModel.findOne({ _id: data.options.id });
    var _name = '正在获取' + (_agentInfo ? '《' + _agentInfo.name + '》' : '') + '中介详情信息...';
    this.logger.log(_name)
    client.emit('log', { event: 'log', type: 'loading', data: _name });
    agentDetails = await this.getAgentDetails(data.options, client)
    _agentInfo = await this._agentModel.findOne({ _id: agentDetails._id });
    // 更新中介信息
    if (_agentInfo) {
      // 更新加改状态
      _ainfo = {
        _id: agentDetails._id
      }
      await this._agentModel.updateMany({ _id: _ainfo._id }, { $set: { ...agentDetails } });
      this.logger.log('中介《' + agentDetails.name + '》数据已更新...')
      client.emit('log', { event: 'log', type: 'success', data: '中介《' + agentDetails.name + '》数据已更新...' });
    } else {
      _ainfo = await this._agentModel.create(agentDetails)
      this.logger.log('中介《' + agentDetails.name + '》入库成功...')
      client.emit('log', { event: 'log', type: 'success', data: '中介《' + agentDetails.name + '》入库成功...' });
    }
    var aid = data.options.onOff === '1' ? _ainfo._id : data.options.id || _ainfo._id;
    var agentInfo = await this._agentModel.findOne({ _id: aid });
    // 获取中介所有房源 获取的房源不为0时才去执行
    if (data.options.isList === '2' && !_agentInfo.state) {
      if (agentInfo.sale > 0 || agentInfo.rent > 0) {
        this.logger.log('正在获取《' + agentInfo.name + '》房源详情信息...')
        client.emit('log', { event: 'log', type: 'loading', data: '正在获取《' + agentInfo.name + '》房源详情信息...' });
        agentHouseList = await this.getAgentHouseList({
          target_url: agentInfo?.houseUrl,
          stepsActive: 1,
          isList: true,
          crack: !agentInfo.state ? data.options.crack : '2',
        }, client, agentInfo._id);
        if (agentHouseList.rent.length > 0) {
          await Promise.all(agentHouseList.rent.map(async (item: any) => {
            var isData = await this._housingModel.findOne({ _id: item._id });
            // rent
            if (!isData) {
              await this._housingModel.create(item);
              client.emit('log', { event: 'log', type: 'success', data: '房源《' + item.house_name + '》入库成功...' });
            } else {
              await this._housingModel.updateMany({ _id: item._id }, { $set: { ...item, state: 1 } });
              client.emit('log', { event: 'log', type: 'success', data: '房源《' + item.house_name + '》数据更新成功...' });
            }
          }));
        }
        if (agentHouseList.sale.length > 0) {
          await Promise.all(agentHouseList.sale.map(async (item: any) => {
            var isData = await this._housingModel.findOne({ _id: item._id });
            // sale
            if (!isData) {
              await this._housingModel.create(item);
              client.emit('log', { event: 'log', type: 'success', data: '房源《' + item.house_name + '》入库成功...' });
            } else {
              await this._housingModel.updateMany({ _id: item._id }, { $set: { ...item, state: 1 } });
              client.emit('log', { event: 'log', type: 'success', data: '房源《' + item.house_name + '》数据更新成功...' });
            }
          }));
        }
        await this._agentModel.updateMany({ _id: agentInfo._id }, { $set: { state: 1 } });
      } else {
        client.emit('log', { event: 'log', type: 'warning', data: '中介《' + agentInfo.name + '》无房源数据...' });
      }
    }
    return new Promise((resolve, reject) => {
      this.logger.log('中介《' + agentInfo.name + '》已完成数据爬取...')
      client.emit('log', { event: 'log', type: 'success', data: '中介《' + agentInfo.name + '》已完成数据爬取...' });
      resolve({
        agentDetails,
        agentHouseList
      });
    })
  }
  // 获取房源信息
  public async getHouseData(client: any, target_url: any, _agentInfo: any) {
    if (_agentInfo) {
      this.logger.log('正在补充房源详情信息...')
      client.emit('log', { event: 'log', type: 'loading', data: '正在补充房源详情信息...' });
    }
    let housingDetails: any = await this.getHousingDetails({
      target_url: target_url,
      stepsActive: 3,
      crack: '2',
    }, client);
    // 关联房源信息爬取与录入
    var housingInfo = await this._housingModel.findOne({ _id: housingDetails._id });
    // 反向查询区域 
    var housingAddress = null;
    var housingAddInfo = null;
    if (housingDetails.loc_lng && housingDetails.loc_lat) {
      housingAddress = await this.getGeocode(housingDetails.loc_lat + ',' + housingDetails.loc_lng);
      housingAddInfo = this.toolsService.getIndexArray(this.areaScreen, housingAddress, 'enName')
    }
    var housingTypeInfo = this.toolsService.getIndexArray(this.toolsService.getTypeName(), housingDetails.type_three, 'enName');
    // 补充区域信息
    housingDetails.add_one = (housingAddInfo && housingAddInfo[0]) || { value: 14001, name: 'Singapore' };
    housingDetails.add_two = (housingAddInfo && housingAddInfo[1]) || { value: 14001006, name: 'N/A' };
    housingDetails.add_three = (housingAddInfo && housingAddInfo[2]) || { value: 14001006001, name: 'N/A' };
    // 楼层
    housingDetails.house_level = this.toolsService.getLevel(housingDetails.house_level);
    // 任期
    housingDetails.tenure = this.toolsService.getTenure(housingDetails.tenure);
    if (housingDetails.land_size === 'N/A' || !housingDetails.land_size) {
      housingDetails.land_size = 0.00
    }

    // 补充类型
    housingDetails.type_one = housingTypeInfo[0] || { value: 16003, name: 'N/A' };
    housingDetails.type_two = housingTypeInfo[1] || { value: 16003001, name: 'N/A' };
    housingDetails.type_three = housingTypeInfo[2] || { value: 16003001001, name: 'N/A' };
    // sale
    if (!housingInfo) {
      await this._housingModel.create(housingDetails);
      client.emit('log', { event: 'log', type: 'success', data: '房源《' + housingDetails.house_name + '》入库成功...' });
    } else {
      await this._housingModel.updateMany({ _id: housingDetails._id }, { $set: { ...housingDetails, state: 2 } });
      client.emit('log', { event: 'log', type: 'success', data: '房源《' + housingDetails.house_name + '》数据已更新...' });
    }
    // 获取第三方视频连接缩略图
    if (housingDetails.video.length > 0) {
      this.logger.log('获取房源第三方视频连接缩略图...')
      client.emit('log', { event: 'log', type: 'loading', data: '获取房源第三方视频连接缩略图...' });
      await Promise.all(housingDetails.video.map(async (_itemData: any, _itemIndex: any) => {
        console.log('连接加载' + (_itemData.url.indexOf('youtube.com') > -1));
        if (_itemData.url.indexOf('youtube.com') > -1) {
          var _Thumbnail = await this.getVideoThumbnail({
            target_url: _itemData.url,
            stepsActive: 3,
            player: true,
          }, client);
          _itemData.thumbnail = _Thumbnail;
          return _itemData;
        }
      }));
    }
    await this.getCommunityData(client, housingInfo)
    // 将房源所有的资源放一起利于下载
    await this._kPuppeteerService.download(housingDetails, 1);
    return new Promise((resolve, reject) => {
      resolve({ code: 200, data: housingDetails });
    })
  }
  // 获取房源整个流程
  public async asyncGethouseData(client: any, data: any) {
    var _this = this;
    return new Promise(async (resolve, reject) => {
      // 第一步 获取中介的信息
      let agentsInfo: any = await _this.getAgentData(data, client);
      if (agentsInfo.agentDetails) {
        var housingInfo = await this._housingModel.find({ agent_id: agentsInfo.agentDetails?._id });
        var _resData = [];
        if (housingInfo.length > 0) {
          console.log('housingInfo');
          var queue = cargoQueue(async (tasks: any, callback: any) => {
            await Promise.all(tasks.map(async (_res: any) => {
              var _rsData: any = await _this.getHouseData(client, _res.url, agentsInfo)
              if (_rsData && _rsData.code === 200) {
                _resData.push(_rsData.data)
                callback();
              }
            }))
          }, 1, 1);
          housingInfo.map((item: any) => {
            if (!item.state || item.state === 1) {
              queue.push({ url: item.url }, async (err) => {
                this.logger.log('【' + item.house_name + '】完成任务');
                if (housingInfo[housingInfo.length - 1]._id === item._id) {
                  this.logger.log('最后一个已经完成任务');
                  resolve({ code: 200, data: _resData });
                }
              });
            }
          })
        }
      }
    })
  }

  // 获取小区
  public async getCommunityData(client: any, data: any) {
    // 关联小区信息爬取与录入
    if (data.community_id) {
      this.logger.log('正在获取《' + data.house_name + '》关联小区信息...')
      client.emit('log', { event: 'log', type: 'loading', data: '正在获取《' + data.house_name + '》关联小区信息...' });
      var communityDetails: any = await this.getHouseCommunity({
        target_url: 'https://www.propertyguru.com.sg' + data.community_id,
        stepsActive: 3,
        crack: '2',
      }, client, data, data.agent_id);
      // 获取第三方视频连接缩略图
      this.logger.log('获取小区第三方视频连接缩略图...')
      client.emit('log', { event: 'log', type: 'loading', data: '获取小区第三方视频连接缩略图...' });
      if (communityDetails && communityDetails.mangement_video && communityDetails.mangement_video.length > 0) {
        await Promise.all(communityDetails.mangement_video.map(async (_itemData: any, _itemIndex: any) => {
          var _Thumbnail = '';
          if (_itemData && _itemData.url.indexOf('www.youtube.com') > -1) {
            _Thumbnail = await this.getVideoThumbnail({
              target_url: _itemData.url,
              stepsActive: 3,
              player: true,
            }, client);
            _itemData.thumbnail = _Thumbnail
          }
          return _itemData;
        }));
      }
      var isCommunityData = await this._communityModel.findOne({ _id: data.community_id });
      if (!isCommunityData) {
        await this._communityModel.create(communityDetails);
        client.emit('log', { event: 'log', type: 'success', data: '房源《' + data.house_name + '》所在关联小区入库成功...' });
      } else {
        await this._communityModel.updateMany({ _id: data.community_id }, { $set: { ...communityDetails, state: 2 } });
        client.emit('log', { event: 'log', type: 'success', data: '房源《' + data.house_name + '》所在关联小区数据已更新...' });
      }
      // 将房源所有的资源放一起利于下载
      var communityInfo = await this._communityModel.findOne({ _id: data.community_id });
      if (communityInfo) {
        let complete = await this._kPuppeteerService.download(communityInfo, 2)
        if (complete) {
          this.logger.log('已完成数据补充...')
          client.emit('log', { event: 'log', type: 'success', data: '已完成数据补充...' });
        }
      }
    } else {
      this.logger.log('《' + data.house_name + '》没有关联小区信息...')
      client.emit('log', { event: 'log', type: 'warning', data: '《' + data.house_name + '》没有关联小区信息...' });
    }
  }
  // 监听数据采集实现日志返回
  @SubscribeMessage('events')
  async puppeteer(@MessageBody() data: any, @ConnectedSocket() client: WebSocket): Promise<any> {
    if (data.type === 'start') {
      var _resData: any = await this.asyncGethouseData(client, data);
      // if (!data.options.stepsActive) {  // 获取中介
      //   // 中介列表
      //   if (data.options.onOff === '2') {
      //     agentsInfo = await this.getAgentsInfo(data, client)
      //     await Promise.all(agentsInfo.map(async (item) => {
      //       var _agentInfo = await this._agentModel.findOne({ _id: item.id });
      //       // 没有id才入库
      //       if (!_agentInfo) {
      //         await this._agentModel.create(item)
      //         client.emit('log', { event: 'log', type: 'success', data: '中介《' + item.name + '》入库成功...' });
      //       } else {
      //         await this._agentModel.updateMany({ _id: _agentInfo._id }, { $set: { ...item } })
      //         client.emit('log', { event: 'log', type: 'success', data: '中介《' + item.name + '》更新成功...' });
      //       }
      //       await this._kPuppeteerService.downloadResource(_agentInfo.photoUrl, 'agent', _agentInfo._id)
      //     }));
      //   } else {
      //     // 单个中介
      //     agentsInfo = await this.getAgentData(data, client);
      //     await this._kPuppeteerService.downloadResource(agentsInfo.agentDetails?.photoUrl, 'agent', agentsInfo.agentDetails?._id)
      //   }
      //   this.logger.log('中介列表数据已完成...')
      //   resData = { type: 'agents', data: agentsInfo }
      // } else if (data.options.stepsActive === 1) { // 获取中介详情信息
      //   let agentData = await this.getAgentData(data, client);
      //   resData = { type: 'agentDetails', data: agentData }
      // } else if (data.options.stepsActive === 2) { // 获取房源信息
      //   var _agentInfo = await this._agentModel.findOne({ _id: data.options.id });
      //   var target_url = [];
      //   if (data.options.target_url.indexOf(',') > -1) {
      //     target_url = data.options.target_url.split(',')
      //   } else {
      //     target_url = [data.options.target_url]
      //   }
      //   if (_agentInfo) {
      //     this.logger.log('正在补充《' + _agentInfo.name + '》房源详情信息...')
      //     client.emit('log', { event: 'log', type: 'loading', data: '正在补充《' + _agentInfo.name + '》房源详情信息...' });
      //   }
      //   await this.getHouseData(client, target_url, _agentInfo?.name)
      // }
      return { event: 'events', data: _resData.data }
    }
  }


}



