# GitHub 技術與資源參考

本專案案例照片、熱點框選、語音講解整合，參考以下開源資源：

## 已整合

| 資源 | 用途 |
|------|------|
| [openedx/xblock-image-explorer](https://github.com/openedx/xblock-image-explorer) | 圖片熱點（hotspot）百分比定位與 tooltip 互動模式（已 clone 至 `vendor/`） |
| [NIOSH / Wikimedia Commons](https://commons.wikimedia.org/) | 真實職災案例照片（Public Domain），存放於 `assets/cases/photos/` |
| Web Speech API | 瀏覽器端繁體中文語音講解（`narration.js`） |

## 可擴充參考

| 資源 | 用途 |
|------|------|
| [HassanRasheed91/Safety-Violation-Detection-For-Construction-Sites](https://github.com/HassanRasheed91/Safety-Violation-Detection-For-Construction-Sites) | YOLOv8 工地安全違規偵測 + 語音警示 |
| [VoxDroid/Construction-Site-Safety-PPE-Detection](https://github.com/VoxDroid/Construction-Site-Safety-PPE-Detection) | 工地 PPE 偵測資料集與 Flask 介面 |
| [ultralytics/ultralytics construction-ppe](https://github.com/ultralytics/ultralytics/blob/main/docs/en/datasets/detect/construction-ppe.md) | 安全帽／背心等 11 類 PPE 標註資料集 |
| [AHA-Taiwan/Safety](https://github.com/AHA-Taiwan/Safety) | 台灣職安宣導資源與 OSHA 手冊連結 |
| [164149043/examination](https://github.com/164149043/examination) | 企業安全生產知識考試系統（題庫結構參考） |
| [k2tzumi/slidev-addon-tts](https://github.com/k2tzumi/slidev-addon-tts) | 幻燈片與語音同步播放技術參考 |

## 真實照片與法規對應

照片必須搭配**人工標註的熱點座標**與**法規講解腳本**，才能與語音同步。資料定義於：

- `case-photo-manifest.js` — 照片、熱點、法規、語音腳本
- `assets/cases/photos/` — 已下載的 NIOSH 公眾領域照片

新增照片流程：
1. 從 Wikimedia Commons（NIOSH Public Domain）或授權清楚的來源下載
2. 目視確認畫面缺失位置，在 manifest 填寫百分比座標
3. 撰寫與該題法規對應的 `detail` 與 `regulation` 語音腳本
