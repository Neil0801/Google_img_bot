const ng = require('nightmare');
const nightmare = ng({ show: true, width: 1024, height: 960 });
const { JSDOM } = require('jsdom');
const fs = require('fs');
const { window } = new JSDOM("");
const $ = require('jquery')(window);
const base64Img = require('base64-to-image')
const util = require('util');
const exec = util.promisify( require('child_process').exec );

let keyword = ' meme' //你要的keyword
let html 
let arrImg = []
let arrBase64 = []
let name = 1
let regex = /https:\/\//g
let bs64Regex = /^data:[A-Za-z-+\/]+;base64,.+$/g
let maxImg = 70 //你要幾張
const headers = {
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
};
async function init(){
    if( ! await fs.existsSync(`downloads`) ){
        await fs.mkdirSync(`downloads`, {recursive: true});
    }    
    if( ! await fs.existsSync(`downloads/meme`) ){
        await fs.mkdirSync(`downloads/meme`, {recursive: true});
    }
}
async function visit(){
    console.log('start gogo')
    await nightmare
    .goto('https://google.com', headers)
    .type('input.gLFyf.gsfi', keyword)
    .wait(500)
    .click('div.FPdoLc.tfB0Bf>center>input.gNO89b')
    .wait(500)
    .click('div.hdtb-mitem.hdtb-imb:nth-of-type(2)>a')
    .wait(500)
    .click('div.PNyWAd.ZXJQ7c')
    .wait(500)
    .click('div.DZjDQ')
    .wait(500)
    .click('div.Ix6LGe>a.MfLWbb:nth-of-type(1)')
    .wait(1000)
    console.log('選擇器完畢')
    
}
async function scroll(){
    await nightmare.wait('div.isv-r.PNCib.MSM1fd.BUooTd');
    let innerHeightOfWindow = 0
    let totalOffset = 0;
    while(totalOffset <= innerHeightOfWindow){
        innerHeightOfWindow = await nightmare.evaluate(() => {
            return document.documentElement.scrollHeight;
        });

        totalOffset += 500;

        await nightmare.scrollTo(totalOffset, 0).wait(500);

        console.log(`totalOffset = ${totalOffset}, innerHeightOfWindow = ${innerHeightOfWindow}`);

        if( totalOffset > 4000 ){
            break;
        }
    }
}

async function clickForMore(){
    let selector 
    for (let number = 1; number < maxImg; number++) {    
        try{
            selector = `div.isv-r.PNCib.MSM1fd.BUooTd:nth-of-type(${number})>a>div>img`
            console.log(selector)
            html = await nightmare
                .click(selector)
                .wait(300)
                .evaluate(() => {
                    return document.documentElement.innerHTML;
                })
            let img = $(html)
                .find('div.pxAole>div.tvh9oe.BIB1wf>c-wiz>div>div>div>div:nth-of-type(2)>a>img')
                .attr('src')
            if (regex.test(img) == true) {
                arrImg.push(img)
            } 
            else if (bs64Regex.test(img) == true) {
                arrBase64.push(img)
            } else {
            }
        } catch(err){
            console.log(err)
            continue
        }
    }

}
async function bs64Img() {
    console.log('bs64')
    for (let i of arrBase64) {
        if(  arrBase64 == null ){
            break
        }
        if (i == null) {
            continue
        }
        try {
            var base64Str = i;
            var path = 'downloads/img';
            var optionalObj = { 'fileName': name, 'type': 'png' };
            base64Img(base64Str, path, optionalObj);
            name = name + 1
            console.log(name)
        } catch (error) {
            console.log(error)
            continue
        }
    }

}

async function fileWrite(){
    for(let i of arrImg){
        try {
            if (i == null) {
                continue
            }
            await exec(`curl -k -X GET "${i}" -o "downloads/img/${name}.png"`);
            name = name + 1
            console.log(name)
        } catch (error) {
            console.log(error)
            continue
        }
    }
}

async function asyncArray(functionList){
    for(let func of functionList){
        await func();
    }
}

(
    async function (){
        await asyncArray([
            init, //初始化目錄
            visit, //進入google img
            scroll, //滾動頁面取得動態生成資料
            clickForMore, //點入每張照片
            bs64Img, //下載base64照片
            fileWrite //下載一般照片
        ]).then(async ()=>{
            console.log('Done')
        });
    }
)()