const core = require("@actions/core");
const github = require("@actions/github");
var AWS = require("aws-sdk");
const archiver = require("archiver");
var fs = require("fs");
var path = require("path");

try {
  const region = core.getInput("region");
  const accessKeyId = core.getInput("accessKeyId");
  const secretAccessKey = core.getInput("secretAccessKey");
  const bucket = core.getInput("bucket");
  const lambda_name = core.getInput("lambdaName");
  const workspace = process.env.GITHUB_WORKSPACE;
  var output = fs.createWriteStream(workspace + "/" + lambda_name);
  var source = fs.createWriteStream(workspace);

  zipDirectory(source, output);
  send_file(bucket, source);
} catch (error) {
  core.setFailed(error.message);
}

function send_file(bucket, file) {
  s3 = new AWS.S3({ apiVersion: "2006-03-01" });

  var uploadParams = { Bucket: bucket, Key: "", Body: "" };
  
  var fileStream = fs.createReadStream(file);
  fileStream.on("error", function (err) {
    console.log("File Error", err);
  });

  uploadParams.Body = fileStream;
 
  uploadParams.Key = path.basename(file);

  // call S3 to retrieve upload file to specified bucket
  s3.upload(uploadParams, function (err, data) {
    if (err) {
      console.log("Error", err);
    }
    if (data) {
      console.log("Upload Success", data.Location);
    }
  });
}

//https://stackoverflow.com/a/51518100
function zipDirectory(source, out) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on("error", (err) => reject(err))
      .pipe(stream);

    stream.on("close", () => resolve());
    archive.finalize();
  });
}
