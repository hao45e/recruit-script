

// 标题包含内容和不包含内容
let titleContain = ['java', '后端'];
let titleExclude = [];
// 最低薪资
let leastSalary = 15000;
// 是否兼职
let isPartTimeJob = true;
// boss活跃 包含
let bossActiveContain = ['刚刚活跃','日内活跃'];
// 详情 包含 不包含
let descContain = [];
let descExclude = ['统招', '全日制'];

class OrderedMap {
  constructor() {
    this.map = new Map();
    this.order = [];
  }

  set(key, value) {
    if (!this.map.has(key)) {
      this.order.push(key);
    }
    this.map.set(key, value);
    return this;
  }

  get(key) {
    return this.map.get(key);
  }

  delete(key) {
    const index = this.order.indexOf(key);
    if (index !== -1) {
      this.order.splice(index, 1);
      this.map.delete(key);
    }
    return this;
  }

  entries() {
    return this.order.map(key => [key, this.map.get(key)]);
  }

  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }

  forEach(callback, thisArg) {
    this.entries().forEach(([key, value]) => callback.call(thisArg, value, key, this));
  }

  size() {
    return this.map.size;
  }

  clear() {
    this.order = [];
    this.map.clear();
    return this;
  }
}

function moveBottom(){
  var scrollTarget = document.querySelector('.job-recommend-main');
  if (scrollTarget && scrollTarget.scrollHeight > scrollTarget.clientHeight) {
    scrollTarget.scrollTo({
      top: scrollTarget.scrollHeight,
      behavior: 'smooth'
    });
  }
}
function kanzhunNumberReplace(str){
  let numArr = ['','','','','','','','','',''];
  let result = '';
  for (let char of str) {
    let index = numArr.indexOf(char);
    result += (index !== -1 ? index.toString() : char);
  }
  return result;
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function getMaxSalary(str, startChar, endChar) {
  let startIndex = str.indexOf(startChar);
  if (startIndex === -1) return '';
  let endIndex = str.indexOf(endChar, startIndex + startChar.length);
  if (endIndex === -1) endIndex = str.length;
  return str.slice(startIndex + startChar.length, endIndex);
}
function checkSalaryRange(salaryString) {
  let minSalary = leastSalary;
  let isPartTime = isPartTimeJob;
  if(salaryString === '面议') return true;
  if(salaryString.indexOf('元/小时') !== -1){
    if(isPartTime){
      return true;
    }else{
      return false;
    }
  }
  let cleaned = salaryString.replace(/·.*$/g, '').replace(/[^0-9\-]/g, '');
  let [minStr, maxStr] = cleaned.split('-');
  let max = parseInt(maxStr);
  if (salaryString.includes('K')) {
    max *= 1000;
  }
  if(max >= minSalary){
    return true;
  }else{
    return false;
  }
}
async function checkJob(index, jobItem){
  let jobName = jobItem.find('.job-name').text().trim();
  let isTitleContained = titleContain.some(keyword => jobName.includes(keyword));
  let isTitleExcluded = titleExclude.some(keyword => jobName.includes(keyword));

  let jobSalary = kanzhunNumberReplace(jobItem.find('.job-salary').text().trim());
  let jobSalaryFlag = checkSalaryRange(jobSalary);

  let bossName = jobItem.find('.boss-name').text().trim();

  if(isTitleContained && !isTitleExcluded && jobSalaryFlag){
    await jobItem.click();
    await sleep(2000);

    let jobDetail = $('.job-detail-container');
    let jobDesc = jobDetail.find('.desc');
    jobDesc.find('style').empty();
    let jobDescStr = jobDesc.text();
    let jobOnline = jobDetail.find('.boss-online-tag').text();
    let jobActive = jobDetail.find('.boss-active-time').text();

    let isActive;
    if(jobOnline === '在线'){
      isActive = true;
      jobActive = jobOnline;
    }else{
      isActive = bossActiveContain.some(keyword => jobActive.includes(keyword));
    }
    let isDescContained = true;
    if(descContain.length != 0){
      isDescContained = descContain.some(keyword => jobDescStr.includes(keyword));
    }
    let isDescExcluded = descExclude.some(keyword => jobDescStr.includes(keyword));
    if(isActive && isDescContained && !isDescExcluded){
      // console.log(jobName+'---'+jobSalary+'---'+bossName+'---'+jobActive+'---'+jobDescStr);
      let href = jobItem.find('.job-name').attr('href');
      dataMap.set(href, 
        {
          index: index, 
          jobName: jobName,
          jobSalary: jobSalary,
          bossName: bossName,
          jobActive: jobActive,
          jobDescStr: jobDescStr
        })
    }
  }
}

let dataMap = new OrderedMap();


// 每页15个
let pageSize = 15;
let totalSize = 0;

async function loadPage(page){
  for(let i = 0; i < page; i++){
    moveBottom();
    await sleep(2000);
  }
  await checkDetail();
}
async function checkDetail(){
  let jobList = $('.rec-job-list').children();
  let count = 0;
  for(let i = totalSize; i < jobList.size(); i++){
    let jobItem = jobList.eq(i);
    await checkJob(i, jobItem);
    count++;
    console.log(i+'/'+jobList.size()+'('+dataMap.size()+')');
  }
  totalSize = jobList.size();
  console.error('共加载'+totalSize+';本次加载'+count+';筛选出'+dataMap.size());
  appendHtml();
}


function appendHtml(){
  let str = '<table style="margin:0 auto;" border="1">';
  dataMap.forEach((value, key) => {
    str+='<tr my-id="'+key+'" title="'+value.jobDescStr+'"><td>'+value.index+'</td><td>'+value.jobName+'</td><td>'+value.jobSalary+'</td><td>'+value.bossName+'</td><td>'+value.jobActive+'</td><td><a target="_blank" href="'+key+'">查看</a></td></tr>';
  });
  str+='</table></div>';
  
  $("#myTable").empty();
  $('#myTable').html(str);
}

function initHtml(){
  $("#myDiv").remove();
  $('body').prepend('<div id="myDiv" style="margin-top:70px;"><div id="myOperation"><input type="number" id="myPageNum" value="1"><button id="loadPage">加载</button><button id="reset">当前页重查</button></div><div id="myTable" style="height:200px; overflow-y:auto;"></div>');
}
$(document).on("click", "#loadPage", function(){
  let num = $("#myPageNum").val();
  loadPage(num);
});
$(document).on("click", "#reset", function(){
  totalSize = 0;
  dataMap.clear();
  checkDetail();
});

initHtml();
