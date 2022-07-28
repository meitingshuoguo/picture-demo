/*
  将file对象转化为base64编码
  file  目标file对象
 */
function fileToBase64(file, callback) {
  let reader;
  if (file) {
    // 创建流对象
    reader = new FileReader();
    reader.readAsDataURL(file);
  }
  // 捕获 转换完毕
  reader.onload = function (e) {
    // 转换后的base64就在e.target.result里面,直接放到img标签的src属性即可
    callback(e.target.result);
  };
}
/*
  将base64转化为file
  file  目标file对象
 */
function dataURLtoFile(dataUrl, filename) {
  // 获取到base64编码
  let arr = dataUrl.split(","),
    // 将base64编码转为字符串
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], `${filename}.${mime.split("/")[1]}`, {
    type: mime,
  });
}
/* 
  图片格式和大小检查
*/
function beforeCheckForImg(
  file,
  allowTypes = ["jpg", "jpeg", "png"],
  maxSize = 10
) {
  const { size, type } = file;
  const tmpTypes = type.split("/")[1];
  let result = {
    msg: "",
  };
  if (allowTypes.indexOf(tmpTypes) < 0) {
    result = { msg: "请上传png、jpg、jpeg格式图片" };
  }
  if (size > maxSize * 1024 * 1024) {
    result = { msg: `请上传小于${maxSize}MB的图片` };
  }
  return result;
}

/* 
  下载图片
*/
function downLoad(downloadName, imgSrc) {
  const tag = document.createElement("a");
  // 此属性的值就是下载时图片的名称，注意，名称中不能有半角点，否则下载时后缀名会错误
  tag.setAttribute("download", downloadName.replace(/\./g, "。"));
  tag.href = imgSrc;
  tag.click();
}
/* 
  复制到剪贴板
*/
function copyClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    throw new Error("不支持当前浏览器");
  }
}
/* 
  读取剪贴板
*/
function readClipboard() {
  if (navigator.clipboard) {
    return navigator.clipboard.readText();
  } else {
    throw new Error("不支持当前浏览器");
  }
}
/* 
判断图片是否存在
*/
function isHasImg(img) {
  const { size, width, height } = img;
  return img && (size > 0 || (width > 0 && height > 0));
}

/* 
  请求
*/
function axios(url, options) {
  return fetch(url, options).then((response) => response.json());
}
