// 加载中
function loader(node, status) {
  if (status) {
    const newNode = document.createElement("div");
    newNode.setAttribute("class", "loader");
    node.appendChild(newNode);
  } else {
    node.querySelector(".loader").remove();
  }
}

function message(message, time = 1.5) {
  const newNode = document.createElement("div");
  newNode.setAttribute("class", "tipMessage");
  newNode.innerHTML = message;
  document.querySelector("#main").appendChild(newNode);
  setTimeout(() => {
    document.querySelector(".tipMessage").remove();
  }, time * 1000);
}

// 显示地址
function isShowAddress(status, url) {
  const addressNode = document.querySelector(".address");
  addressNode.style.visibility = status ? "visible" : "hidden";
  if (status) {
    addressNode.querySelector("a").href = url;
    addressNode.querySelector("a").innerHTML = url;
  }
}
// 预览的关闭按钮
const textPreviewBtnClose = document.getElementById("text-preview-btn-close");

// 预览的关闭按钮的点击事件
textPreviewBtnClose.addEventListener("click", () => {
  const ele = document.querySelector(".text-preview");
  ele.style.display = "none";
  document.querySelector(".text-preview .content").innerHTML = "";
});

// input file 表单项
const inputFile = document.getElementById("input-file");

// 全局的fileData
let fileData = null;

// 图片上传到本地
function pictureUploadToLocal(fileData) {
  isShowAddress(false);
  // 检查图片格式和大小
  const checkResult = beforeCheckForImg(fileData);
  if (checkResult.msg) {
    message(checkResult.msg);
  } else {
    loader(document.querySelector(".picture-upload"), true);
    // file转base64
    fileToBase64(fileData, (base64) => {
      // 创建一个图片。因为需要知道上传的图片的宽高。
      const img = document.createElement("img");
      img.src = base64;
      img.onload = () => {
        //创建一个canvas
        const { width, height } = img;
        const canvas = document.createElement("canvas");
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // 灰阶处理
        const imageData = ctx.getImageData(0, 0, width, height);
        let data = imageData.data;
        /*灰度处理：求r，g，b的均值，并赋回给r，g，b*/
        for (let i = 0, n = data.length; i < n; i += 4) {
          let average = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = average;
          data[i + 1] = average;
          data[i + 2] = average;
        }
        ctx.putImageData(imageData, 0, 0);

        // 将处理好的图片进行预览
        if (previewImg) {
          loader(document.querySelector(".picture-upload"), false);
          previewImg.src = canvas.toDataURL(fileData.type);
          previewImg.onload = () => {
            updatePreviewImg(previewImg);
          };
        }
      };
    });
  }
}

// 预览图片
const previewImg = document.querySelector(".preview-img");
function updatePreviewImg(target) {
  const { width, height } = document.querySelector(".preview-img");
  const { clientHeight, clientWidth } =
    document.querySelector(".picture-upload");
  if (width / height < clientWidth / clientHeight) {
    target.style.height = "100%";
  } else {
    target.style.height = "auto";
  }
}

// 拖拽放置目标事件
document.addEventListener("dragenter", function (e) {
  e.stopPropagation();
  e.preventDefault();
});
document.addEventListener("dragover", function (e) {
  e.stopPropagation();
  e.preventDefault();
});

// 放置完毕
document.addEventListener("drop", function (e) {
  e.stopPropagation();
  e.preventDefault();
  let files = e.dataTransfer.files; //获取文件
  // 拖拽上传
  pictureUploadToLocal(files[0]);
});

// 表单上传
inputFile.onchange = function () {
  fileData = this.files[0];
  pictureUploadToLocal(fileData);
};

// 第一个按钮
const btn1 = document.getElementById("btn-1");
btn1.addEventListener("click", function ({ target }) {
  if (isHasImg(previewImg)) {
    isShowAddress(false);
    const { src } = previewImg;
    if (src) {
      loader(target, true);
      // 预览该地址
      document.querySelector(".text-preview").style.display = "block";
      const ele = document.querySelector(".text-preview .content");
      ele.innerText = src;
      // 复制转换后的base64到剪贴板
      try {
        copyClipboard(src).then(() => {
          loader(target, false);
          message("已复制到剪贴板");
        });
      } catch (error) {
        message(error.message);
      }
    }
  } else {
    message("暂无图片");
  }
});

// 第二个按钮
const btn2 = document.getElementById("btn-2");
btn2.addEventListener("click", function () {
  if (isHasImg(previewImg)) {
    const { src } = previewImg;
    downLoad("newImage", src);
  } else {
    message("暂无图片");
  }
});

// 第三个按钮
const btn3 = document.getElementById("btn-3");
btn3.addEventListener("click", function ({ target }) {
  // 查看当前是否有正在预览的图片
  if (isHasImg(previewImg)) {
    try {
      loader(target, true);
      // 从剪贴板中取数据
      const txtPromise = readClipboard();
      txtPromise.then((text) => {
        if (text.includes("data:") && text.includes("base64")) {
          const base64 = text;
          const canvas = document.createElement("canvas");
          let pixel = Math.ceil(base64.length / 3); // 1一个像素存3个字节,
          let size = Math.ceil(Math.sqrt(pixel));
          canvas.width = canvas.height = size;
          const ctx = canvas.getContext("2d");
          const imageData = ctx.getImageData(0, 0, size, size);
          let data = imageData.data;
          let j = 0;
          for (let i = 0, n = data.length; i < n; i++) {
            if (i == 3 || i % 4 === 3) {
              imageData.data[i] = 255;
            } else {
              if (j < base64.length) {
                imageData.data[i] = base64.charCodeAt(j);
                j++;
              } else {
                continue;
              }
            }
          }
          ctx.putImageData(imageData, 0, 0);
          loader(target, false);
          // 将处理好的图片进行预览和上传
          if (previewImg) {
            const arr = base64.split(","),
              // 将base64编码转为字符串
              mime = arr[0].match(/:(.*?);/)[1];

            previewImg.src = canvas.toDataURL(mime);
            previewImg.onload = () => {
              updatePreviewImg(previewImg);
            };
            let fileData = dataURLtoFile(previewImg.src, "strImage");
            let formData = new FormData();
            if (fileData) {
              formData.append("file", fileData);
              loader(target, true);

              axios("http://localhost:3000/upload", {
                method: "post",
                body: formData,
              }).then((result) => {
                loader(target, false);
                isShowAddress(true, result.url);
              });
            }
          } else {
            message("暂时无法预览");
          }
        } else {
          message("暂未从剪贴板中获取到base64字符串，无法进行下一步。");
        }
      });
    } catch (error) {
      message(error.message);
    }
  } else {
    message("暂无图片");
  }
});

// 第四个按钮
const btn4 = document.getElementById("btn-4");
// input file 表单项
const inputFileForRestore = document.getElementById("picture-restore");
inputFileForRestore.onchange = function () {
  fileData = this.files[0];
  // 检查图片格式和大小
  const checkResult = beforeCheckForImg(fileData);
  if (checkResult.msg) {
    message(checkResult.msg);
  } else {
    // file转base64
    fileToBase64(fileData, (base64) => {
      // 创建一个图片。因为需要知道上传的图片的宽高。
      const img = document.createElement("img");
      img.src = base64;
      img.onload = () => {
        //创建一个canvas
        const { width, height } = img;

        const canvas = document.createElement("canvas");
        let pixel = Math.ceil(base64.length / 3); // 1一个像素存3个字节,
        let size = Math.ceil(Math.sqrt(pixel));
        // canvas.width = canvas.height = size;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, width, height);
        let data = imageData.data;
        // let arr = [];
        // for (let i = 0, n = data.length; i < n; i++) {
        //   console.log(data[i]);
        //   if (data[i] > 31) {
        //     console.log("first");
        //     arr.push(String.fromCharCode(data[i]));
        //   }
        //   // if (i === 3 || i % 4 === 3) {
        //   //   // data[i] = 255 - data[i];
        //   // } else {
        //   //   if (data[i] !== undefined) {
        //   //     if (data[i] !== 0) {
        //   //       console.log(data[i]);
        //   //     }
        //   //   }
        //   //   // data[i] = Number();
        //   // }
        //   // str += String.fromCharCode(data[i]);
        //   // data[i] = String.fromCharCode(data[i]);
        // }
        // console.log(arr.join(""));
        // ctx.putImageData(imageData, 0, 0);

        // // 将处理好的图片进行预览和上传
        // if (previewImg) {
        //   // previewImg.src = str;
        // } else {
        //   message("暂时无法预览");
        // }
      };
    });
  }
};
