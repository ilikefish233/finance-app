import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

/**
 * 一键分类所有交易记录
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    // 获取用户的所有分类
    const categories = await prisma.category.findMany({
      where: { userId },
    });

    // 获取用户的所有交易记录
    const transactions = await prisma.transaction.findMany({
      where: { userId },
    });

    if (transactions.length === 0) {
      return successResponse(null, "没有交易记录需要分类");
    }

    // 定义分类规则
    const categorizationRules: Record<string, string> = {
      // 收入分类规则
      "工资": "income",
      "奖金": "income",
      "投资": "income",
      "兼职": "income",
      "礼金": "income",
      "退款": "income",
      
      // 支出分类规则
      "餐饮": "expense",
      "外卖": "expense",
      "购物": "expense",
      "交通": "expense",
      "打车": "expense",
      "加油": "expense",
      "停车": "expense",
      "娱乐": "expense",
      "电影": "expense",
      "游戏": "expense",
      "医疗": "expense",
      "药品": "expense",
      "教育": "expense",
      "学费": "expense",
      "书籍": "expense",
      "住房": "expense",
      "房租": "expense",
      "水电": "expense",
      "通讯": "expense",
      "手机": "expense",
      "网络": "expense",
      "旅行": "expense",
      "酒店": "expense",
      "门票": "expense",
    };

    // 按类型和名称索引分类，确保分类名称的唯一性
    const categoriesMap = new Map<string, typeof categories[0]>();
    categories.forEach(category => {
      const key = `${category.type}-${category.name.toLowerCase()}`;
      categoriesMap.set(key, category);
    });

    // 按类型分组分类
    const categoriesByType = categories.reduce((acc, category) => {
      if (!acc[category.type]) {
        acc[category.type] = [];
      }
      acc[category.type].push(category);
      return acc;
    }, {} as Record<string, typeof categories>);

    // 微信账单自动分类映射（与批量导入保持一致）
    const categoryKeywordMap: Record<string, string[]> = {
      "餐饮": ["餐厅", "饭店", "餐馆", "食堂", "外卖", "小吃", "火锅", "烧烤", "快餐", "早餐", "午餐", "晚餐", "饮品", "咖啡", "奶茶", "酒吧", "麦当劳", "肯德基", "必胜客", "星巴克", "汉堡王", "德克士", "华莱士", "真功夫", "吉野家", "味千拉面", "永和大王", "海底捞", "呷哺呷哺", "小肥羊", "大龙燚", "小龙坎", "蜀大侠", "巴奴毛肚火锅", "谭鸭血", "贤和庄", "德庄", "刘一手", "皇城老妈", "小天鹅", "秦妈火锅", "桥头火锅", "孔亮火锅", "周师兄", "朱光玉", "陈艳红", "楠火锅", "袁老四", "火锅", "烧烤", "烤肉", "烤鱼", "烤串", "铁板烧", "烧腊", "卤味", "鸭脖", "鸭翅", "鸭掌", "鸭头", "鸡爪", "鸡翅", "鸡腿", "鸡排", "炸鸡", "烤鸭", "烧鸭", "白切鸡", "盐焗鸡", "黄焖鸡", "叫花鸡", "口水鸡", "烧鸡", "扒鸡", "熏鸡", "烤鸡", "炸鸡", "鸡公煲", "鸡煲", "煲仔饭", "盖浇饭", "炒饭", "炒面", "汤面", "拌面", "拉面", "刀削面", "炸酱面", "热干面", "担担面", "臊子面", "油泼面", "烩面", "板面", "米线", "米粉", "河粉", "肠粉", "凉皮", "凉粉", "凉面", "冷面", "酸辣粉", "螺蛳粉", "桂林米粉", "过桥米线", "土豆粉", "地瓜粉", "粉丝", "粉条", "面条", "面食", "包子", "馒头", "花卷", "烧卖", "饺子", "馄饨", "汤圆", "元宵", "粽子", "月饼", "蛋糕", "面包", "饼干", "巧克力", "糖果", "果冻", "布丁", "冰淇淋", "雪糕", "冰棒", "酸奶", "牛奶", "豆浆", "奶茶", "咖啡", "茶", "果汁", "汽水", "可乐", "雪碧", "芬达", "美年达", "七喜", "脉动", "红牛", "东鹏特饮", "营养快线", "旺仔牛奶", "AD钙奶", "爽歪歪", "娃哈哈", "农夫山泉", "怡宝", "百岁山", "康师傅", "统一", "冰露", "昆仑山", "依云", "巴黎水", "气泡水", "苏打水", "矿泉水", "纯净水", "蒸馏水", "自来水", "白开水", "茶水", "咖啡", "奶茶", "果汁", "汽水", "饮料", "酒水", "酒精", "白酒", "啤酒", "红酒", "黄酒", "米酒", "葡萄酒", "香槟", "鸡尾酒", "伏特加", "威士忌", "白兰地", "朗姆酒", "龙舌兰", "金酒", "利口酒", "力娇酒", "清酒", "烧酒", "梅酒", "果酒", "药酒", "保健酒", "黄酒", "白酒", "啤酒", "红酒", "酒", "餐饮", "吃", "喝", "食品", "披萨", "美团", "拉面", "饺子"],
      "交通": ["地铁", "公交", "出租车", "打车", "滴滴", "单车", "共享单车", "火车", "高铁", "飞机", "机票", "油费", "停车费", "过路费", "加油站", "高速", "路桥", "交通", "运输", "出行", "旅行", "旅游", "车票", "船票", "交通费", "通勤", "班车", "包车", "租车", "自驾", "汽车", "车辆", "车", "地铁", "轨道交通", "城铁", "轻轨", "磁悬浮", "公交", "公共汽车", "巴士", "大巴", "中巴", "小巴", "出租车", "的士", "计程车", "网约车", "滴滴", "优步", "曹操出行", "首汽约车", "高德打车", "美团打车", "哈啰出行", "T3出行", "阳光出行", "滴滴顺风车", "拼车", "共享单车", "共享自行车", "共享电动车", "ofo", "摩拜", "哈啰单车", "青桔单车", "美团单车", "滴滴单车", "小蓝单车", "优拜单车", "永安行", "公共自行车", "自行车", "电动车", "摩托车", "三轮车", "四轮车", "汽车", "轿车", "SUV", "MPV", "跑车", "豪华车", "越野车", "卡车", "货车", "客车", "公交车", "出租车", "网约车", "班车", "包车", "租车", "自驾车", "私家车", "二手车", "新车", "汽车销售", "汽车维修", "汽车保养", "汽车美容", "洗车", "加油", "加油站", "中石化", "中石油", "中海油", "壳牌", "BP", "埃克森美孚", "道达尔", "雪佛龙", "马拉松石油", "康菲石油", "加油站", "油费", "汽油", "柴油", "煤油", "机油", "润滑油", "停车", "停车场", "停车费", "车位", "停车位", "停车库", "高速", "高速公路", "过路费", "过桥费", "过隧道费", "收费站", "ETC", "高速费", "路桥费", "交通罚款", "违章", "罚单", "扣分", "驾驶证", "行驶证", "车辆年检", "年审", "保险", "车险", "交强险", "商业险", "第三者责任险", "车损险", "盗抢险", "玻璃险", "划痕险", "自燃险", "涉水险", "不计免赔", "火车", "高铁", "动车", "城际铁路", "普速列车", "绿皮车", "硬座", "硬卧", "软卧", "软座", "一等座", "二等座", "商务座", "无座", "站票", "火车票", "高铁票", "动车票", "列车", "车次", "车站", "火车站", "高铁站", "动车站", "机场", "飞机场", "航空", "航班", "机票", "登机牌", "行李", "托运", "安检", "登机", "起飞", "降落", "延误", "取消", "改签", "退票", "航空公司", "国航", "东航", "南航", "海航", "厦航", "上航", "深航", "山航", "川航", "春秋航空", "吉祥航空", "奥凯航空", "华夏航空", "西部航空", "北部湾航空", "成都航空", "多彩贵州航空", "福州航空", "桂林航空", "海南航空", "河北航空", "江西航空", "昆明航空", "兰州航空", "山东航空", "深圳航空", "四川航空", "天津航空", "乌鲁木齐航空", "西藏航空", "祥鹏航空", "浙江长龙航空", "中国国际航空", "中国东方航空", "中国南方航空", "中国海南航空", "船", "轮船", "客轮", "货轮", "游轮", "邮轮", "轮渡", "摆渡船", "快艇", "游艇", "帆船", "渔船", "货船", "客船", "码头", "港口", "船票", "轮渡票", "交通", "运输"],
      "购物": ["超市", "商场", "商店", "便利店", "淘宝", "京东", "拼多多", "网购", "电商", "服装", "鞋子", "化妆品", "电子产品", "数码", "电器", "家具", "家居", "饰品", "首饰", "珠宝", "手表", "眼镜", "箱包", "皮具", "运动", "健身", "户外", "图书", "文具", "玩具", "礼品", "礼物", "鲜花", "蛋糕", "烘焙", "购物", "买", "购", "超市", "大卖场", "仓储超市", "会员店", "便利店", "社区店", "生鲜超市", "食品超市", "生活用品超市", "家居超市", "电器超市", "服装超市", "鞋帽超市", "箱包超市", "化妆品超市", "护肤品超市", "美妆超市", "彩妆超市", "香水超市", "珠宝超市", "首饰超市", "手表超市", "眼镜超市", "玩具超市", "文具超市", "图书超市", "音像超市", "礼品超市", "鲜花超市", "蛋糕超市", "烘焙超市", "运动用品超市", "健身用品超市", "户外用品超市", "汽车用品超市", "办公用品超市", "文具用品超市", "电脑用品超市", "数码用品超市", "手机用品超市", "家电超市", "电器超市", "家具超市", "家居超市", "家纺超市", "厨具超市", "餐具超市", "五金超市", "工具超市", "建材超市", "装饰材料超市", "灯具超市", "开关插座超市", "电线电缆超市", "管材管件超市", "油漆涂料超市", "瓷砖超市", "地板超市", "卫浴超市", "洁具超市", "水龙头超市", "马桶超市", "浴缸超市", "淋浴房超市", "浴室柜超市", "五金配件超市", "螺丝螺母超市", "钉子超市", "胶水超市", "胶带超市", "工具超市", "手动工具超市", "电动工具超市", "气动工具超市", "测量工具超市", "仪器仪表超市", "机械配件超市", "轴承超市", "齿轮超市", "链条超市", "链轮超市", "皮带超市", "输送带超市", "密封件超市", "紧固件超市", "标准件超市", "非标准件超市", "模具超市", "模具配件超市", "刀具超市", "刃具超市", "量具超市", "夹具超市", "辅具超市", "机床附件超市", "机器人配件超市", "自动化配件超市", "电子元件超市", "集成电路超市", "芯片超市", "电阻超市", "电容超市", "电感超市", "二极管超市", "三极管超市", "场效应管超市", "晶闸管超市", "继电器超市", "开关超市", "插座超市", "插头超市", "电线超市", "电缆超市", "光纤超市", "光缆超市", "连接器超市", "接插件超市", "端子超市", "端子排超市", "接线端子超市", "电缆接头超市", "电缆终端头超市", "母线槽超市", "桥架超市", "配电柜超市", "配电箱超市", "控制柜超市", "控制箱超市", "电源超市", "变压器超市", "稳压器超市", "UPS超市", "电池超市", "蓄电池超市", "锂电池超市", "干电池超市", "太阳能电池超市", "充电器超市", "充电设备超市", "逆变器超市", "变频器超市", "软启动器超市", "接触器超市", "断路器超市", "熔断器超市", "热继电器超市", "按钮超市", "指示灯超市", "蜂鸣器超市", "传感器超市", "接近开关超市", "光电开关超市", "行程开关超市", "压力开关超市", "温度开关超市", "流量开关超市", "液位开关超市", "编码器超市", "光栅尺超市", "数显表超市", "温控器超市", "变频器超市", "PLC超市", "DCS超市", "工控机超市", "人机界面超市", "触摸屏超市", "组态软件超市", "工业软件超市", "办公软件超市", "软件超市", "系统软件超市", "应用软件超市", "游戏软件超市", "教育软件超市", "杀毒软件超市", "安全软件超市", "工具软件超市", "办公设备超市", "电脑超市", "笔记本电脑超市", "台式电脑超市", "平板电脑超市", "一体机电脑超市", "迷你电脑超市", "服务器超市", "工作站超市", "电脑配件超市", "CPU超市", "处理器超市", "主板超市", "内存超市", "内存条超市", "硬盘超市", "机械硬盘超市", "固态硬盘超市", "混合硬盘超市", "显示器超市", "屏幕超市", "显卡超市", "声卡超市", "网卡超市", "键盘超市", "鼠标超市", "音箱超市", "耳机超市", "摄像头超市", "打印机超市", "复印机超市", "扫描仪超市", "传真机超市", "投影仪超市", "路由器超市", "交换机超市", " modem超市", "网络设备超市", "手机超市", "智能手机超市", "功能手机超市", "老人手机超市", "儿童手机超市", "手机配件超市", "手机壳超市", "手机膜超市", "充电器超市", "数据线超市", "耳机超市", "移动电源超市", "充电宝超市", "电池超市", "手机电池超市", "相机超市", "数码相机超市", "单反相机超市", "微单相机超市", "卡片相机超市", "拍立得超市", "摄像机超市", "相机配件超市", "镜头超市", "存储卡超市", "电池超市", "充电器超市", "三脚架超市", "云台超市", "闪光灯超市", "滤镜超市", "相机包超市", "镜头盖超市", "UV镜超市", "偏振镜超市", "渐变镜超市", "长焦镜头超市", "广角镜头超市", "定焦镜头超市", "变焦镜头超市", "微距镜头超市", "鱼眼镜头超市", "移轴镜头超市", "折返镜头超市", "电影镜头超市", "监控摄像头超市", "安防设备超市", "报警器超市", "门禁系统超市", "考勤机超市", "一卡通超市", "停车系统超市", "道闸超市", "栏杆机超市", "安检设备超市", "金属探测器超市", "X光机超市", "安检门超市", "消防设备超市", "灭火器超市", "消防栓超市", "烟雾报警器超市", "火灾探测器超市", "消防水带超市", "消防水枪超市", "消防接口超市", "消防手套超市", "消防靴超市", "消防头盔超市", "消防服超市", "救生衣超市", "救生圈超市", "救生艇超市", "急救包超市", "急救箱超市", "医疗用品超市", "药品超市", "药店超市", "药房超市", "医疗器械超市", "医疗设备超市", "健身器材超市", "运动器材超市", "户外用品超市", "露营装备超市", "帐篷超市", "睡袋超市", "登山包超市", "登山鞋超市", "徒步鞋超市", "运动鞋超市", "运动服超市", "健身服超市", "瑜伽垫超市", "哑铃超市", "杠铃超市", "跑步机超市", "椭圆机超市", "动感单车超市", "健身车超市", "划船机超市", "攀岩墙超市", "拳击袋超市", "跳绳超市", "拉力器超市", "臂力器超市", "握力器超市", "俯卧撑支架超市", "仰卧起坐板超市", "倒立机超市", "按摩器超市", "按摩椅超市", "足浴盆超市", "保健器材超市", "养生器材超市", "美容器材超市", "美发器材超市", "美甲器材超市", "纹绣器材超市", "彩妆器材超市", "护肤品超市", "化妆品超市", "香水超市", "洗发水超市", "护发素超市", "沐浴露超市", "香皂超市", "牙膏超市", "牙刷超市", "漱口水超市", "洗面奶超市", "爽肤水超市", "乳液超市", "面霜超市", "精华液超市", "眼霜超市", "面膜超市", "防晒霜超市", "隔离霜超市", "粉底液超市", "粉饼超市", "散粉超市", "腮红超市", "眼影超市", "眼线笔超市", "睫毛膏超市", "唇膏超市", "口红超市", "唇彩超市", "唇釉超市", "美甲油超市", "指甲油超市", "卸妆水超市", "卸妆油超市", "卸妆乳超市", "化妆棉超市", "棉签超市", "面膜纸超市", "压缩面膜超市", "美容工具超市", "化妆刷超市", "粉扑超市", "美妆蛋超市", "睫毛夹超市", "修眉刀超市", "眉笔超市", "眉粉超市", "染眉膏超市", "发蜡超市", "发胶超市", "摩丝超市", "定型喷雾超市", "护发精油超市", "发膜超市", "焗油膏超市", "染发剂超市", "烫发水超市", "直发膏超市", "啫喱水超市", "啫喱膏超市", "弹力素超市", "护发素超市", "洗发水超市", "沐浴露超市", "香皂超市", "牙膏超市", "牙刷超市", "漱口水超市", "洗面奶超市", "爽肤水超市", "乳液超市", "面霜超市", "精华液超市", "眼霜超市", "面膜超市", "防晒霜超市", "隔离霜超市", "粉底液超市", "粉饼超市", "散粉超市", "腮红超市", "眼影超市", "眼线笔超市", "睫毛膏超市", "唇膏超市", "口红超市", "唇彩超市", "唇釉超市", "美甲油超市", "指甲油超市", "卸妆水超市", "卸妆油超市", "卸妆乳超市", "化妆棉超市", "棉签超市", "面膜纸超市", "压缩面膜超市", "美容工具超市", "化妆刷超市", "粉扑超市", "美妆蛋超市", "睫毛夹超市", "修眉刀超市", "眉笔超市", "眉粉超市", "染眉膏超市", "发蜡超市", "发胶超市", "摩丝超市", "定型喷雾超市", "护发精油超市", "发膜超市", "焗油膏超市", "染发剂超市", "烫发水超市", "直发膏超市", "啫喱水超市", "啫喱膏超市", "弹力素超市"],
      "教育": ["学校", "学费", "书本", "教材", "培训", "课程", "辅导班", "教育", "学习", "考试", "考证", "留学", "游学", "研学", "幼儿园", "小学", "中学", "大学", "研究生院", "博士", "硕士", "本科", "专科", "职业学校", "技校", "中专", "职高", "培训机构", "教育机构", "学习中心", "培训中心", "课程中心", "辅导中心", "补习班", "补课班", "兴趣班", "特长班", "艺术班", "音乐班", "美术班", "舞蹈班", "体育班", "奥数班", "英语班", "语文班", "数学班", "物理班", "化学班", "生物班", "历史班", "地理班", "政治班", "考试中心", "考点", "考场", "准考证", "成绩单", "毕业证", "学位证", "学历证", "资格证", "证书", "认证", "教育", "学习", "培训", "课程", "考试", "考证", "学校", "学院", "大学", "研究所", "研究院", "实验室", "图书馆", "书店", "书吧", "阅览室", "自习室", "教育", "学习", "培训", "课程", "考试", "考证", "学校", "学院", "大学", "研究所", "研究院", "实验室", "图书馆", "书店", "书吧", "阅览室", "自习室"],
      "娱乐": ["电影", "游戏", "娱乐", "KTV", "影院", "演出", "演唱会", "体育", "健身", "运动", "游泳", "瑜伽", "舞蹈", "音乐", "美术", "绘画", "书法", "摄影", "旅游", "旅行", "度假", "休闲", "娱乐", "游戏", "电竞", "网吧", "网咖", "桌游", "剧本杀", "密室逃脱", "轰趴", "派对", "聚会", "酒吧", "夜店", "迪厅", "舞厅", "歌厅", "影院", "电影院", "戏院", "剧院", "剧场", "音乐厅", "歌剧院", "话剧院", "儿童剧院", "演出", "表演", "演唱会", "音乐会", "话剧", "歌剧", "舞剧", "音乐剧", "儿童剧", "杂技", "魔术", "马戏", "体育", "运动", "健身", "健美", "瑜伽", "普拉提", "舞蹈", "街舞", "爵士舞", "拉丁舞", "芭蕾舞", "民族舞", "现代舞", "肚皮舞", "钢管舞", "武术", "跆拳道", "拳击", "散打", "泰拳", "柔道", "摔跤", "击剑", "射箭", "射击", "游泳", "跳水", "水球", "花样游泳", "田径", "马拉松", "短跑", "长跑", "中长跑", "跨栏", "跳远", "跳高", "三级跳远", "铅球", "铁饼", "标枪", "链球", "体操", "艺术体操", "竞技体操", "蹦床", "篮球", "足球", "排球", "乒乓球", "羽毛球", "网球", "棒球", "垒球", "橄榄球", "手球", "曲棍球", "冰球", "高尔夫球", "台球", "保龄球", "壁球", "板球", "马球", "藤球", "毽球", "门球", "沙狐球", "地掷球", "木球", "软式网球", "娱乐", "游戏", "玩", "乐"],
      "医疗": ["医院", "药店", "医疗", "药品", "看病", "治疗", "体检", "医生", "护士", "诊所", "卫生室", "社区医院", "卫生院", "保健院", "防疫站", "疾控中心", "急救中心", "血站", "献血", "输血", "制药", "药房", "药店", "药铺", "药材", "中药", "西药", "中成药", "草药", "处方药", "非处方药", "OTC", "保健品", "营养品", "补品", "医疗", "医院", "诊所", "药店", "医生", "护士", "看病", "治疗", "检查", "体检", "手术", "住院", "门诊", "急诊", "急救", "医疗", "医院", "诊所", "药店", "医生", "护士", "看病", "治疗", "检查", "体检", "手术", "住院", "门诊", "急诊", "急救"],
      "住房": ["房租", "水电费", "物业费", "宽带费", "燃气费", "水费", "电费", "煤气费", "暖气费", "物业费", "管理费", "维修费", "装修", "装饰", "家具", "家居", "家电", "电器", "房产", "房地产", "开发商", "中介", "租房", "买房", "卖房", "房贷", "首付", "按揭", "抵押", "公积金", "住房", "房子", "公寓", "别墅", "住宅", "小区", "花园", "广场", "大厦", "写字楼", "办公楼", "商铺", "店面", "门面", "出租", "租赁", "租金", "房租", "押金", "中介费", "服务费", "管理费", "物业费", "维修费", "保养费", "清洁费", "卫生费", "保安费", "停车费", "车位费", "水电费", "水费", "电费", "燃气费", "煤气费", "暖气费", "宽带费", "网费", "电话费", "话费", "有线电视费", "收视费", "物业费", "管理费", "维修费", "保养费", "清洁费", "卫生费", "保安费", "停车费", "车位费", "水电费", "水费", "电费", "燃气费", "煤气费", "暖气费", "宽带费", "网费", "电话费", "话费", "有线电视费", "收视费"],
      "生活缴费": ["水费", "电费", "燃气费", "煤气费", "暖气费", "宽带费", "网费", "电话费", "话费", "有线电视费", "收视费", "物业费", "管理费", "维修费", "保养费", "清洁费", "卫生费", "保安费", "停车费", "车位费", "缴费", "交费", "付款", "支付", "账单", "费用", "收费", "费用", "缴费", "交费", "付款", "支付", "账单", "费用", "收费", "费用"],
      "其他": ["其他", "杂项", "未分类", " Uncategorized"]
    };
    
    // 扩展分类规则，提高分类精细度
    const extendedCategorizationRules: Record<string, { type: string; icon: string; color: string }> = {
      // 收入分类规则
      "工资": { type: "income", icon: "💼", color: "#EF4444" },
      "奖金": { type: "income", icon: "🏆", color: "#EF4444" },
      "投资": { type: "income", icon: "📈", color: "#EF4444" },
      "兼职": { type: "income", icon: "👔", color: "#EF4444" },
      "礼金": { type: "income", icon: "🎁", color: "#EF4444" },
      "退款": { type: "income", icon: "🔄", color: "#EF4444" },
      "红包": { type: "income", icon: "🧧", color: "#EF4444" },
      "理财": { type: "income", icon: "💹", color: "#EF4444" },
      "股息": { type: "income", icon: "📊", color: "#EF4444" },
      "利息": { type: "income", icon: "💰", color: "#EF4444" },
      
      // 支出分类规则
      "餐饮": { type: "expense", icon: "🍜", color: "#10B981" },
      "购物": { type: "expense", icon: "🛒", color: "#10B981" },
      "交通": { type: "expense", icon: "🚗", color: "#10B981" },
      "打车": { type: "expense", icon: "🚖", color: "#10B981" },
      "加油": { type: "expense", icon: "⛽", color: "#10B981" },
      "停车": { type: "expense", icon: "🅿️", color: "#10B981" },
      "公共交通": { type: "expense", icon: "🚌", color: "#10B981" },
      "高铁": { type: "expense", icon: "🚄", color: "#10B981" },
      "飞机": { type: "expense", icon: "✈️", color: "#10B981" },
      "娱乐": { type: "expense", icon: "🎮", color: "#10B981" },
      "电影": { type: "expense", icon: "🎬", color: "#10B981" },
      "游戏": { type: "expense", icon: "🎯", color: "#10B981" },
      "医疗": { type: "expense", icon: "🏥", color: "#10B981" },
      "药品": { type: "expense", icon: "💊", color: "#10B981" },
      "教育": { type: "expense", icon: "📚", color: "#10B981" },
      "学费": { type: "expense", icon: "🎓", color: "#10B981" },
      "书籍": { type: "expense", icon: "📖", color: "#10B981" },
      "住房": { type: "expense", icon: "🏠", color: "#10B981" },
      "房租": { type: "expense", icon: "🏡", color: "#10B981" },
      "水电": { type: "expense", icon: "💧", color: "#10B981" },
      "通讯": { type: "expense", icon: "📱", color: "#10B981" },
      "手机": { type: "expense", icon: "📞", color: "#10B981" },
      "网络": { type: "expense", icon: "🌐", color: "#10B981" },
      "旅行": { type: "expense", icon: "🧳", color: "#10B981" },
      "酒店": { type: "expense", icon: "🏨", color: "#10B981" },
      "门票": { type: "expense", icon: "🎫", color: "#10B981" },
      "健身": { type: "expense", icon: "💪", color: "#10B981" },
      "美容": { type: "expense", icon: "💄", color: "#10B981" },
      "服饰": { type: "expense", icon: "👕", color: "#10B981" },
      "数码": { type: "expense", icon: "💻", color: "#10B981" },
      "家居": { type: "expense", icon: "🏠", color: "#10B981" },
    };

    // 用于防止并发创建重复分类的锁对象
    const categoryLocks = new Map<string, Promise<void>>();
    const lockPromises = new Map<string, Promise<void>>();
    
    // 获取分类锁的函数
    const getCategoryLock = async (categoryName: string, type: string): Promise<() => void> => {
      const lockKey = `${type}-${categoryName.toLowerCase()}`;
      
      // 如果已经有锁，等待锁释放
      while (categoryLocks.has(lockKey)) {
        await categoryLocks.get(lockKey);
      }
      
      // 创建新锁
      let resolveLock: () => void;
      const lockPromise = new Promise<void>((resolve) => {
        resolveLock = resolve;
      });
      
      categoryLocks.set(lockKey, lockPromise);
      
      // 返回释放锁的函数
      return () => {
        categoryLocks.delete(lockKey);
        resolveLock!();
      };
    };
    
    // 处理每个交易记录
    const updatePromises = transactions.map(async (transaction) => {
      let matchedCategoryId: string | null = null;

      // 1. 首先根据交易描述匹配分类
      if (transaction.description) {
        const lowerDesc = transaction.description.toLowerCase();
        
        // 存储匹配到的分类名称和关键词
        const matchedCategories: { categoryName: string; keyword: string }[] = [];
        
        // 使用关键词映射查找匹配（与批量导入保持一致）
        for (const [categoryName, keywords] of Object.entries(categoryKeywordMap)) {
          for (const keyword of keywords) {
            if (lowerDesc.includes(keyword)) {
              matchedCategories.push({ categoryName, keyword });
            }
          }
        }
        
        // 优先选择更具体的关键词匹配（按关键词长度排序）
        matchedCategories.sort((a, b) => b.keyword.length - a.keyword.length);
        
        // 遍历匹配到的分类
        for (const { categoryName } of matchedCategories) {
          const categoryType = "expense";
          const categoryKey = `${categoryType}-${categoryName.toLowerCase()}`;
          
          // 先尝试从缓存获取
          let matchedCategory = categoriesMap.get(categoryKey);
          
          // 如果没有匹配到，查找或创建分类
          if (!matchedCategory) {
            // 检查数据库中是否已存在该分类（不区分大小写）
            const allTypeCategories = await prisma.category.findMany({
              where: {
                userId,
                type: categoryType
              }
            });
            
            // 查找是否存在同名分类（不区分大小写）
            let existingCategory = allTypeCategories.find(cat => 
              cat.name.toLowerCase() === categoryName.toLowerCase()
            );
            
            // 再次检查数据库，确保在并发情况下没有被其他交易创建
            if (!existingCategory) {
              const latestCategories = await prisma.category.findMany({
                where: {
                  userId,
                  type: categoryType
                }
              });
              existingCategory = latestCategories.find(cat => 
                cat.name.toLowerCase() === categoryName.toLowerCase()
              );
            }
            
            if (!existingCategory) {
              // 获取分类锁，防止并发创建
              const releaseLock = await getCategoryLock(categoryName, categoryType);
              
              try {
                // 最后一次检查，确保在并发情况下没有被其他交易创建
                const finalCheck = await prisma.category.findMany({
                  where: {
                    userId,
                    type: categoryType
                  }
                });
                
                existingCategory = finalCheck.find(cat => 
                  cat.name.toLowerCase() === categoryName.toLowerCase()
                );
                
                if (!existingCategory) {
                  // 创建新分类
                  const rule = extendedCategorizationRules[categoryName];
                  if (rule) {
                    existingCategory = await prisma.category.create({
                      data: {
                        userId,
                        name: categoryName,
                        type: rule.type,
                        icon: rule.icon,
                        color: rule.color,
                      },
                    });
                  } else {
                    // 如果没有规则，使用默认设置
                    existingCategory = await prisma.category.create({
                      data: {
                        userId,
                        name: categoryName,
                        type: categoryType,
                        icon: "📦",
                        color: "#10B981",
                      },
                    });
                  }
                }
              } finally {
                // 释放锁
                releaseLock();
              }
            }
            
            if (existingCategory) {
              // 更新分类缓存
              categoriesMap.set(categoryKey, existingCategory);
              if (!categoriesByType[categoryType]) {
                categoriesByType[categoryType] = [];
              }
              if (!categoriesByType[categoryType].find(c => c.id === existingCategory.id)) {
                categoriesByType[categoryType].push(existingCategory);
              }
              matchedCategory = existingCategory;
            }
          }
          
          if (matchedCategory) {
            matchedCategoryId = matchedCategory.id;
            break;
          }
        }
        
        // 确保创建所有常用分类（与批量导入保持一致）
        const commonCategories = ["餐饮", "交通", "购物", "娱乐", "医疗", "教育", "住房", "生活缴费"];
        
        for (const categoryName of commonCategories) {
          const categoryKey = `expense-${categoryName.toLowerCase()}`;
          if (!categoriesMap.has(categoryKey)) {
            // 检查数据库中是否已存在该分类
            const allExpenseCategories = await prisma.category.findMany({
              where: {
                userId,
                type: "expense"
              }
            });
            
            let existingCategory = allExpenseCategories.find(cat => 
              cat.name.toLowerCase() === categoryName.toLowerCase()
            );
            
            if (!existingCategory) {
              // 获取分类锁，防止并发创建
              const releaseLock = await getCategoryLock(categoryName, "expense");
              
              try {
                // 再次检查
                const finalCheck = await prisma.category.findMany({
                  where: {
                    userId,
                    type: "expense"
                  }
                });
                
                existingCategory = finalCheck.find(cat => 
                  cat.name.toLowerCase() === categoryName.toLowerCase()
                );
                
                if (!existingCategory) {
                  // 创建新分类
                  const rule = extendedCategorizationRules[categoryName];
                  if (rule) {
                    existingCategory = await prisma.category.create({
                      data: {
                        userId,
                        name: categoryName,
                        type: rule.type,
                        icon: rule.icon,
                        color: rule.color,
                      },
                    });
                  } else {
                    // 使用默认设置
                    existingCategory = await prisma.category.create({
                      data: {
                        userId,
                        name: categoryName,
                        type: "expense",
                        icon: "📦",
                        color: "#10B981",
                      },
                    });
                  }
                }
              } finally {
                releaseLock();
              }
            }
            
            if (existingCategory) {
              // 更新分类缓存
              categoriesMap.set(categoryKey, existingCategory);
              if (!categoriesByType["expense"]) {
                categoriesByType["expense"] = [];
              }
              if (!categoriesByType["expense"].find(c => c.id === existingCategory.id)) {
                categoriesByType["expense"].push(existingCategory);
              }
            }
          }
        }
      }

      // 2. 如果没有匹配到，根据交易类型创建或使用默认分类
      if (!matchedCategoryId) {
        const typeCategories = categoriesByType[transaction.type];
        
        if (typeCategories && typeCategories.length > 0) {
          // 优先使用默认分类
          const defaultCategory = typeCategories.find(cat => 
            (transaction.type === 'income' && cat.name === '其他收入') ||
            (transaction.type === 'expense' && cat.name === '其他支出')
          );
          
          if (defaultCategory) {
            matchedCategoryId = defaultCategory.id;
          } else {
            // 使用该类型的第一个分类
            matchedCategoryId = typeCategories[0].id;
          }
        } else {
          // 如果该类型没有分类，自动创建默认分类
          const defaultCategoryName = transaction.type === 'income' ? '其他收入' : '其他支出';
          const categoryKey = `${transaction.type}-${defaultCategoryName.toLowerCase()}`;
          
          let defaultCategory = categoriesMap.get(categoryKey);
          if (!defaultCategory) {
            // 检查数据库中是否已存在该分类（不区分大小写）
            const allTypeCategories = await prisma.category.findMany({
              where: {
                userId,
                type: transaction.type
              }
            });
            
            // 查找是否存在同名分类（不区分大小写）
            defaultCategory = allTypeCategories.find(cat => 
              cat.name.toLowerCase() === defaultCategoryName.toLowerCase()
            );
            
            // 再次检查数据库，确保在并发情况下没有被其他交易创建
            if (!defaultCategory) {
              const latestCategories = await prisma.category.findMany({
                where: {
                  userId,
                  type: transaction.type
                }
              });
              defaultCategory = latestCategories.find(cat => 
                cat.name.toLowerCase() === defaultCategoryName.toLowerCase()
              );
            }
            
            if (!defaultCategory) {
              // 获取分类锁，防止并发创建
              const releaseLock = await getCategoryLock(defaultCategoryName, transaction.type);
              
              try {
                // 最后一次检查，确保在并发情况下没有被其他交易创建
                const finalCheck = await prisma.category.findMany({
                  where: {
                    userId,
                    type: transaction.type
                  }
                });
                
                const existingCategory = finalCheck.find(cat => 
                  cat.name.toLowerCase() === defaultCategoryName.toLowerCase()
                );
                
                if (existingCategory) {
                  defaultCategory = existingCategory;
                } else {
                  // 创建默认分类
                  defaultCategory = await prisma.category.create({
                    data: {
                      userId,
                      name: defaultCategoryName,
                      type: transaction.type,
                      icon: transaction.type === 'income' ? '💰' : '💸',
                      color: transaction.type === 'income' ? '#EF4444' : '#10B981',
                    },
                  });
                }
              } finally {
                // 释放锁
                releaseLock();
              }
            }
            
            // 更新分类缓存
            categoriesMap.set(categoryKey, defaultCategory);
            categoriesByType[transaction.type] = [defaultCategory];
          }
          
          matchedCategoryId = defaultCategory.id;
        }
      }

      // 3. 如果找到匹配的分类，更新交易记录
      if (matchedCategoryId) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { categoryId: matchedCategoryId },
        });
      }

      return matchedCategoryId;
    });

    // 执行所有更新操作
    await Promise.all(updatePromises);

    return successResponse(null, "一键分类成功");
  } catch (error) {
    console.error("一键分类错误:", error);

    if (error instanceof Error && error.message === "未授权") {
      return errorResponse("未授权", 401);
    }

    return serverErrorResponse(error, "一键分类失败");
  }
}
