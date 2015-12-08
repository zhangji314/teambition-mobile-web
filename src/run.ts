import {DingService} from './components/bases/DingService';
import {WechatService} from './components/bases/WechatService';
import {MomentLocale} from './components/bases/MomentLocale';
import {getParam} from './components/bases/Utils';
import {app} from './components/config/config';
import {
  IRootScope,
  Iapp,
  IDingSignature,
  IWxSignature
} from 'teambition';

declare let webkitURL;
declare let wx;
declare let dd;
declare let zone: Zone;

export let Wechat: WechatService;
export let Ding: DingService;
export let DingCorpid: string;
export let OrganizationId: string;

export let rootZone = zone.fork();

export let $$injector: any;

export let URL: URL = window.URL || webkitURL;

export function noop() {
  return false;
};

// @ngInject
export const RunFn = function(
  $http: any,
  $q: angular.IQService,
  $rootScope: IRootScope,
  moment: moment.MomentStatic
) {

  let initWechat = () => {
    return $http.get('/weixin/dev/signature');
  };

  let initDD = () => {
    DingCorpid = getParam(window.location.search, 'corpId');
    let defer = $q.defer();
    if (DingCorpid && DingCorpid.length) {
      $http.get(app.dingApiHost + `/signature?corpId=${DingCorpid}`)
      .then((data: any) => {
        let info: IDingSignature = data.data;
        OrganizationId = info._organizationId;
        Ding = new DingService(info.agentId, info.corpId, info.timeStamp, info.nonceStr, info.signature);
        Ding.$http = $http;
        defer.resolve();
      });
    }else {
      defer.resolve();
    }
    return defer.promise;
  };

  if (typeof wx === 'object') {
    $rootScope.pending = initWechat()
    .then((data: IWxSignature) => {
      Wechat = new WechatService(app.wxid, data.noncestr, data.timestamp, data.signature);
    })
    .catch((reason: any) => {
      console.log('error', '微信SDK初始化失败', '您不能正常使用分享项目给好友功能');
    });
  }else if (typeof dd === 'object') {
    $rootScope.pending = initDD();
  }else {
    let defer = $q.defer();
    defer.resolve();
    $rootScope.pending = defer.promise;
  }

  MomentLocale(app.LANGUAGE, moment);
};
