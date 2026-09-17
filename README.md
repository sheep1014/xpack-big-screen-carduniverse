# XPACK Big Screen · Card Universe

Live Card Universe + Card Hunt，獨立 Public Screen。

Preview: https://sheep1014.github.io/xpack-big-screen-carduniverse/

## 本地開發
Node 22.12+，執行 `npm ci`、`npm run dev`。
入口 http://localhost:5186/src/public-screen/index.html?count=35&live=1

## 部署
`npm run build` 輸出 dist-public-screen，根 index.html 為雲端入口。
main 保存源碼；gh-pages 保存靜態建置。推送 main 後 GitHub Actions 自動更新 gh-pages。
GitHub Pages 設為 gh-pages 分支 / 根目錄。

## 操作與素材
1 / 2 切換模式，D 開啟調試，Esc 關閉詳情。Card Hunt 點空白處新增模擬提交。
196 張原始 WebP 已隨源碼提供，無外部卡圖請求。首次載入需下載約 37.5 MB，載入完成才進入展示。
全部業務資料為 Mock，不驗卡、不判定獲獎，刷新重置。
卡名依原素材目錄的年份／類別／卡號顯示；未核實資料不補造。
詳細資料結構見 docs/public-screen/HANDOFF.md。

來源：codex/public-screen-phase1，1d70633。原工作分支未合併。
