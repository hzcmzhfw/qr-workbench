# 二维码工作台

独立 Chrome Manifest V3 插件，趁手 × 轻办。

当前版本 **1.0.1**。

- [GitHub](https://github.com/hzcmzhfw/qr-workbench)
- [Gitee](https://gitee.com/hzcmzhfw/qr-workbench)
- [下载安装包](https://github.com/hzcmzhfw/qr-workbench/releases/latest)
- [趁手二维码生成](https://tools.hzcmzhfw.cn/qrcode/) · [轻办二维码识别](https://qingban.hzcmzhfw.cn/tools/qr-scan/)

## 使用

1. 下载 Release 安装包或仓库 `releases/qr-workbench-1.0.1.zip`，解压到固定目录。
2. Chrome 打开 `chrome://extensions`，开启开发者模式。
3. 点击“加载已解压的扩展程序”，选择解压目录（内含 manifest.json）。开发时可直接选择本项目的 `extension` 目录。
4. 打开需要分享的网页，点击插件图标，自动生成当前网址二维码。

可编辑网址或文字、选择 128–1024 尺寸与 L/M/Q/H 容错；自动统计 UTF-8 字节，超长内容按趁手格式分片。分片含 `CHENSHOU-QR:序号/总数` 首行，需按序去除首行拼接；普通扫码器不会自动合并，本插件识别完整分片 ZIP 时会自动还原。下载 PNG 或全部分片 ZIP；尺寸过小时自动扩大以保持完整模块与留白。

识别支持选择、拖放图片或 ZIP，以及粘贴本地图片（20 MB 以内，4000 万像素以内）。每张图片识别一个二维码；ZIP 支持子目录，跳过非图片文件，逐张展示成功/失败、复制和打开网址，完整且无重复的一组 CHENSHOU-QR 分片自动按序还原。ZIP 最多 100 张图片、1000 个文件条目，解压图片总计最多 50 MB。不支持密码保护 ZIP 或嵌套 ZIP；不同内容的多组分片请分开上传。支持复制结果，HTTP/HTTPS 结果可点击打开。模糊、遮挡、复杂图片可能识别失败。支持打开完整工作台。

## 网站入口与隐私

生成与识别均在本地执行，无后台、无外部脚本、不上传输入及图片，不保存二维码历史。仅申请 activeTab 权限以读取用户主动打开插件的当前网页。网站入口带 `utm_source=qr_workbench&utm_medium=extension`，不会附带输入内容；网站是否记录来源以各站统计实现为准。本轮未修改网站统计后台。

完整工作台通过扩展内部地址参数传递输入。此地址仅用于本地工作台，不应复制分享；关闭页面后无需保存。

## 开发与验证

- `npm ci`
- `npm run build`
- `npm test`：扫码回读、UTF-8 分片、链接协议。
- `npm run verify`
- `node scripts/browser-check.mjs`：需 Playwright Chromium，隔离扩展环境验证编辑、PNG 下载、图片识别与分片。
- `npm run package`

本项目尚未上架 Chrome 扩展商店，支持开发者模式安装。依赖许可证位于 extension/licenses，qrcode-generator 的 MIT 许可声明保留在源码中。2026-10-13 已在用户 Chrome 安装目录更新至 1.0.1，确认工具栏固定与启用；真实弹窗当前网址读取、编辑与 PNG 下载通过；用户提供的 144 字节文字图片回读一致；完整工作台及工具栏弹窗 ZIP（含子目录、非图片文件）均识别成功 2/2。分片自动还原另经隔离扩展浏览器测试通过。
