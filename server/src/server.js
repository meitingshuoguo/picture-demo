const express = require("express");
const path = require("path");
const multer = require("multer");
const app = new express();
const crypto = require("crypto");
const concat = require("concat-stream");
const fs = require("fs");

const port = 3000;
// 设置静态目录 第一个参数为虚拟的文件前缀，实际上文件系统中不存在
// 可以用public做为前缀来加载static文件夹下的文件了
app.use(express.static(path.join(__dirname, "../public")));

// 根据当前文件目录指定文件夹
const dir = path.resolve(__dirname, "../public/static/img");
// 图片大小限制1024=1kb
const SIZELIMIT = 1024 * 1024 * 10;
const storage = multer.diskStorage({
  // 指定文件路径
  destination: function (req, file, cb) {
    // ！！！相对路径时以node执行目录为基准，避免权限问题，该目录最好已存在*
    // cb(null, './uploads');
    cb(null, dir);
  },
  // 指定文件名
  filename: function (req, file, cb) {
    let oldName = Date.now() + "-" + file.originalname;
    cb(null, oldName);
  },
});

const upload = multer({
  storage: storage,
});

app.post("/upload", upload.single("file"), (req, res) => {
  res.set({
    "Access-Control-Allow-Origin": req.headers.origin || "*",
  });
  // 即将上传图片的key值 form-data对象{key: value}
  // 检查是否有文件待上传
  if (req.file === undefined) {
    return res.json({
      errno: -1,
      msg: "no file",
    });
  }
  const { size, mimetype, filename, path: abPath } = req.file;
  const types = ["jpg", "jpeg", "png"];
  const tmpTypes = mimetype.split("/")[1];
  // 检查文件大小
  if (size >= SIZELIMIT) {
    res.json({
      errno: -1,
      msg: "file is too large",
    });
  }
  // 检查文件类型
  else if (types.indexOf(tmpTypes) < 0) {
    res.json({
      errno: -1,
      msg: "not accepted filetype",
    });
  }

  // 读取文件，文件名修改为hash名
  fs.readFile(abPath, (err, data) => {
    if (err) {
      throw err;
    } else {
      const hash = crypto.createHash("sha256");
      hash.update(data);
      let hex = hash.digest("hex").substring(0, 12);
      const tmpTypes = mimetype.split("/")[1];
      let newFileName = `${hex}.${tmpTypes}`;
      let oldPath = path.join(__dirname, "../public/static/img/" + filename);
      let newPath = path.join(__dirname, "../public/static/img/" + newFileName);
      fs.rename(oldPath, newPath, function (err) {
        if (err) {
          throw err;
        } else {
          const url = `http://localhost:${port}/static/img/${newFileName}`;
          return res.json({
            errno: 0,
            msg: "upload success",
            url,
          });
        }
      });
    }
  });
});

app.listen(port, () => {
  console.log("service start：http://localhost:" + port);
});
