# Public Screen 前端交付

## 範圍
已確認的 Live Card Universe + Card Hunt，2304 × 2784 等比適配。僅 Mock，未接真實上傳；不驗卡、不判定獲獎。POC 卡圖按本次授權直接使用，原素材未改動。估值是示範資料。

## 給產品：免安裝前端依賴
解壓 deploy.zip，將內容交給靜態網站服務，或在解壓目錄執行 `python3 -m http.server 8080`。
開啟 `http://localhost:8080/src/public-screen/index.html?count=35&live=1`。
所有 JS/CSS/卡圖均在包內，不依賴 GitHub、外部 CDN 或線上字體。請透過 HTTP 開啟，不要直接雙擊 HTML。
可放在站點子目錄，保留 assets 與 src 的相對位置。入口為 src/public-screen/index.html。

## 部署
將 deploy.zip 全部解壓到靜態站點根目錄；不需要 Node 服務或 API。
建議部署到產品可穩定訪問的靜態託管/CDN，GitHub 僅作源碼管理。獨立部署地址：https://sheep1014.github.io/xpack-big-screen-carduniverse/；倉庫：https://github.com/sheep1014/xpack-big-screen-carduniverse。main 推送後由 GitHub Actions 自動發布。
HTML 使用 Cache-Control: no-cache；assets/ 雜湊檔名使用 public,max-age=31536000,immutable；啟用 gzip/Brotli。
先上傳新 assets，再切換 HTML；保留上一版 assets 以便舊頁及回滾。勿把資源 404 回退成 HTML。
無 Service Worker；不承諾清除瀏覽器快取後仍可離線重載。現場可用本機 HTTP 服務完全避開外網。

## 給前端
解壓 source.zip，Node 22.12+，`npm ci` 後 `npm run dev:public-screen`，預設 5186。
`npm run build:public-screen` 生成 dist-public-screen。
使用隨包 lockfile，不需 clone GitHub；首次 npm ci 仍需可用 npm registry。
源碼包只包含本頁、依賴的素材模組、原始卡圖及建置設定，不包含其他方向。

## 操作
1 / 2 切换 Universe / Card Hunt，D 開關調試面板，Esc 關閉詳情。
預設點擊 Card Hunt 空白處新增 Mock 提交；點卡牌開詳情。`clickMock=0` 關閉點擊模擬。
URL: mode=universe|cardHunt，count=0..500，live=0|1，huntCount=0..50，huntLive=0|1。
Universe 預設每 5 秒一張；Card Hunt 自動模式每 4 秒一筆。刷新會重置 Mock。

## 接入位置
- model.ts：PublicScreenAdapter / PublicScreenSnapshot / PublicScreenEvent；真實來源實作 getSnapshot、subscribe、connect。
- App.tsx：PublicScreen 接收 source，實際接入時不要傳 simulation。
- huntModel.ts：challengeText、roundLabel、Mock 提交與卡牌資訊。
- CardHuntSubmission.cardDetails：可選卡名、系列、年份、卡號、評級、語言、估值。
- 提交順序由資料 rank 決定，不在前端判斷符合挑戰與否。
- main.tsx：目前預載本地 196 種卡面及 logo（最多 6 個併發請求），全部解碼才進入頁面；45 秒失敗提供重試，已成功項目保留。接入遠端新卡時應在 adapter 發佈提交事件前下載/解碼新圖，不能依賴此固定 Mock 預載清單。
- index.html：JS 下載之前已有輕量載入畫面；20 秒提供重新載入入口。

## 驗證
生產建置通過；以本機 HTTP 測試服務對卡圖延遲 8 秒，檢查載入頁及完成後顯示；另測素材 503 與重試。此測試驗證等待/失敗流程，不代表特定地區 CDN 實際速度。

## 196 張素材更新
本次改用 xpack-card-assets-20260912 完整素材包：棒球 51、籃球 49、Pokémon 49、足球 47。
196 張原 WebP 按位元組核對一致，未裁切、重壓縮或修改。位於 src/public-screen/assets/card-pool，附 catalog.json。
Universe 依類別交錯使用完整 196 張，500 個 Slot 超過 196 後循環；Card Hunt 使用 49 張 Pokémon 卡，第 50 筆才開始重複。
原目錄為去識別化卡片描述，不包含核實的球員/角色完整名稱；英文名稱依年份、類別、卡號組合，未核對語言顯示 Not specified，估值仍為 Mock。
完整圖集約 37.5 MB，因此首次弱網等待會比 13 張示例長；載入完成前不進入大屏，不偷偷降回小素材集。建議現場使用本機 HTTP 或穩定 CDN，重訪使用瀏覽器資源快取。
