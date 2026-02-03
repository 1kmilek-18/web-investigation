# Phase 3: 配信機能 実装計画

**作成日:** 2026-02-02  
**参照:** docs/PROJECT_REVIEW.md, docs/REQUIREMENTS.md v1.4, docs/SDD.md v1.1  
**優先度:** 🔴 最優先（MVP到達のため必須）

---

## 📊 現状分析

### 実装状況
- ✅ Phase 1: 基盤・収集（完了）
- ✅ Phase 2: 要約（完了）
- ✅ Phase 2.5: Settings API（完了）
- ⏳ **Phase 3: 配信（未着手）** ← 現在ここ
- ⏳ Phase 4: Web UI（未着手）
- ⏳ Phase 5: 運用強化（未着手）

### 未実装要件
| 要件ID | 説明 | 優先度 |
|--------|------|--------|
| REQ-EML-001 | 日次ジョブ完了時にメール送信 | 🔴 高 |
| REQ-EML-002 | Gmail送信（SMTP/API） | 🔴 高 |
| REQ-EML-003 | メール本文に記事タイトル・要約・URLを含める | 🔴 高 |
| REQ-EML-004 | 0件時の設定対応（emptySendBehavior） | 🔴 高 |
| REQ-EML-005 | メール送信リトライロジック | 🔴 高 |
| REQ-EML-006 | 失敗通知メール | 🟡 中 |

---

## 🎯 実装目標

**MVP到達条件**: Phase 3完成で収集→要約→配信の全フローが完成

### 受け入れ基準
- ✅ ジョブ実行時に新規記事が収集・要約された場合、1通のメールにすべての記事が含まれる
- ✅ メールには各記事のタイトル、要約、URLが含まれる
- ✅ 0件時はemptySendBehavior設定に応じてスキップまたは通知メールが送信される
- ✅ メール送信失敗時は最大3回までリトライし、失敗時はJobRun.errorsに記録される
- ✅ ジョブ実行時に1件以上の失敗がある場合、失敗通知メールが送信される

---

## 📋 実装タスク詳細

### TSK-EML-001: Gmail送信ライブラリセットアップ

**見積時間**: 2時間  
**依存関係**: なし

**作業内容**:
1. `nodemailer` パッケージをインストール
2. 環境変数設定:
   - `GMAIL_USER`: Gmailアカウント（例: `your-app@gmail.com`）
   - `GMAIL_APP_PASSWORD`: Gmailアプリパスワード（2段階認証必須）
3. Gmail SMTP接続テスト

**受け入れ基準**:
- ✅ `nodemailer` がインストールされている
- ✅ `.env` に `GMAIL_USER`, `GMAIL_APP_PASSWORD` が設定されている
- ✅ Gmail SMTP接続が成功する

**技術的詳細**:
- Gmailアプリパスワードの取得方法をドキュメント化
- SMTP設定: `smtp.gmail.com:587`, TLS有効

---

### TSK-EML-002: Email Sender Service 基本実装

**見積時間**: 3時間  
**依存関係**: TSK-EML-001

**作業内容**:
1. `src/lib/email-sender.ts` を作成
2. `sendEmail(to: string, subject: string, html: string)` 関数を実装
3. Gmail SMTP接続設定
4. エラーハンドリング実装

**受け入れ基準**:
- ✅ `sendEmail()` 関数が実装されている
- ✅ Gmail SMTPでメール送信が成功する
- ✅ エラーハンドリングが実装されている

**実装例**:
```typescript
import nodemailer from 'nodemailer';

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
  });
}
```

---

### TSK-EML-003: 日次メール本文生成機能

**見積時間**: 3時間  
**依存関係**: TSK-EML-002

**作業内容**:
1. `generateDailyEmailBody(articles: Article[])` 関数を実装
2. HTML形式でメール本文を生成
3. 各記事にタイトル、要約、URLを含める
4. 0件時の空メール本文も対応

**受け入れ基準**:
- ✅ 複数記事を1通のメールにまとめられる
- ✅ 各記事にタイトル、要約、URLが含まれる
- ✅ HTML形式でメール本文が生成される
- ✅ 0件時は空のメール本文が生成される

**メール本文テンプレート例**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Web Investigation - 日次配信</title>
</head>
<body>
  <h1>本日収集された記事</h1>
  <p>収集日: {date}</p>
  
  {articles.map(article => `
    <article>
      <h2>${article.title}</h2>
      <p>${article.summary}</p>
      <p><a href="${article.url}">元の記事を読む</a></p>
    </article>
  `)}
</body>
</html>
```

---

### TSK-EML-004: 0件時設定対応

**見積時間**: 2時間  
**依存関係**: TSK-EML-003, TSK-SET-002（Settings API）

**作業内容**:
1. Settings.emptySendBehaviorを取得
2. `emptySendBehavior="skip"` の場合はメール送信をスキップ
3. `emptySendBehavior="sendNotification"` の場合は「新規記事なし」通知メールを送信

**受け入れ基準**:
- ✅ emptySendBehavior="skip" の場合はメール送信をスキップする
- ✅ emptySendBehavior="sendNotification" の場合は通知メールを送信する
- ✅ Settings APIから設定を取得できる

**実装例**:
```typescript
const settings = await prisma.settings.findFirst();
const articles = await getNewArticlesForToday(jobRunId);

if (articles.length === 0) {
  if (settings?.emptySendBehavior === 'skip') {
    console.log('[Email] No new articles, skipping email (emptySendBehavior=skip)');
    return;
  } else if (settings?.emptySendBehavior === 'sendNotification') {
    await sendEmail(
      settings.recipientEmail,
      'Web Investigation - 新規記事なし',
      '<p>本日は新規記事がありませんでした。</p>'
    );
    return;
  }
}
```

---

### TSK-EML-005: メール送信リトライロジック

**見積時間**: 2時間  
**依存関係**: TSK-EML-002

**作業内容**:
1. `sendEmailWithRetry()` 関数を実装
2. 指数バックオフ（1s, 2s, 4s）で最大3回リトライ
3. 3回失敗後はJobRun.errorsに記録

**受け入れ基準**:
- ✅ メール送信失敗時に自動的にリトライされる
- ✅ リトライ間隔が指数バックオフ（1s, 2s, 4s）で実行される
- ✅ 3回失敗後はJobRun.errorsに記録される
- ✅ リトライ回数がログに記録される

**実装例**:
```typescript
async function sendEmailWithRetry(
  to: string,
  subject: string,
  html: string,
  maxRetries = 3
): Promise<{ success: boolean; error?: string }> {
  const delays = [1000, 2000, 4000]; // 1s, 2s, 4s
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await sendEmail(to, subject, html);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`[Email] Send attempt ${attempt + 1} failed: ${errorMessage}`);
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      } else {
        return { success: false, error: errorMessage };
      }
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
}
```

---

### TSK-EML-006: 失敗通知メール機能

**見積時間**: 3時間  
**依存関係**: TSK-EML-002

**作業内容**:
1. `sendFailureNotificationEmail()` 関数を実装
2. JobRun.errorsから失敗詳細を抽出
3. 失敗詳細（sourceUrl, articleUrl, errorType, errorMessage）を含む通知メールを送信
4. Settings.recipientEmailに送信

**受け入れ基準**:
- ✅ ジョブ実行時に失敗がある場合、通知メールが送信される
- ✅ 失敗詳細（sourceUrl, articleUrl, errorType, errorMessage）がメールに含まれる
- ✅ Settings.recipientEmailに送信される

**実装例**:
```typescript
async function sendFailureNotificationEmail(
  jobRunId: string,
  errors: unknown[]
): Promise<void> {
  const settings = await prisma.settings.findFirst();
  if (!settings) {
    console.warn('[Email] Settings not found, skipping failure notification');
    return;
  }

  const errorList = errors.map((error: any) => `
    <li>
      <strong>${error.type}</strong><br>
      ${error.sourceUrl ? `Source: ${error.sourceUrl}<br>` : ''}
      ${error.articleUrl ? `Article: ${error.articleUrl}<br>` : ''}
      Message: ${error.message}
    </li>
  `).join('');

  const html = `
    <h1>Web Investigation - ジョブ実行エラー</h1>
    <p>ジョブ実行ID: ${jobRunId}</p>
    <p>以下のエラーが発生しました:</p>
    <ul>${errorList}</ul>
  `;

  await sendEmailWithRetry(
    settings.recipientEmail,
    'Web Investigation - ジョブ実行エラー',
    html
  );
}
```

---

### TSK-EML-007: Cron Handler 配信統合

**見積時間**: 4時間  
**依存関係**: TSK-EML-003, TSK-EML-004, TSK-EML-005

**作業内容**:
1. `src/lib/cron-handler.ts` の `runDailyJob()` 関数に配信処理を追加
2. 要約完了後、新規記事がある場合はメール送信を実行
3. 0件時はemptySendBehaviorに応じて処理
4. 失敗時は通知メールを送信

**受け入れ基準**:
- ✅ 要約完了後に配信処理が自動実行される
- ✅ 新規記事がある場合はメール送信される
- ✅ 0件時はemptySendBehaviorに応じて処理される
- ✅ 失敗時は通知メールが送信される

**実装フロー**:
```
1. 収集完了
2. 要約完了
3. 停止要求チェック
4. 新規記事取得（当日収集・要約済み）
5. emptySendBehaviorチェック
6. メール送信（リトライ含む）
7. 失敗通知メール送信（エラーがある場合）
8. JobRun更新
```

---

## 🧪 テスト計画

### ユニットテスト
- ✅ Email Sender Serviceのテスト（モック使用）
- ✅ メール本文生成のテスト
- ✅ リトライロジックのテスト

### 統合テスト
- ✅ Cron Handler統合テスト
- ✅ 実際のGmail送信テスト（開発環境）

### E2Eテスト
- ✅ 収集→要約→配信の全フロー検証
- ✅ 実環境での動作確認

---

## 📅 スケジュール

| タスク | 見積時間 | 累計 |
|--------|----------|------|
| TSK-EML-001 | 2時間 | 2時間 |
| TSK-EML-002 | 3時間 | 5時間 |
| TSK-EML-003 | 3時間 | 8時間 |
| TSK-EML-004 | 2時間 | 10時間 |
| TSK-EML-005 | 2時間 | 12時間 |
| TSK-EML-006 | 3時間 | 15時間 |
| TSK-EML-007 | 4時間 | 19時間 |
| **バッファ・統合テスト** | **5時間** | **24時間** |
| **合計** | | **24時間（3-4営業日）** |

---

## 🔧 技術的考慮事項

### Gmailアプリパスワードの取得
1. Googleアカウントで2段階認証を有効化
2. [アプリパスワード](https://myaccount.google.com/apppasswords) で生成
3. 16文字のパスワードを `.env` に設定

### Gmail API制限
- **SMTP送信**: 500通/日（無料アカウント）
- **対策**: 日次配信（1通/日）なので問題なし

### エラーハンドリング
- SMTP接続エラー: リトライ
- 認証エラー: 即時失敗（設定ミス）
- レート制限: リトライ（指数バックオフ）

---

## 📚 参照ドキュメント

- `docs/REQUIREMENTS.md` v1.4 - 要件定義（REQ-EML-001〜006）
- `docs/SDD.md` v1.1 - 設計ドキュメント（Email Sender Service）
- `docs/PROJECT_REVIEW.md` - レビュー結果（Phase 3優先度）
- `docs/TASKS.md` - タスク分解書（TSK-EML-001〜007）

---

**最終更新:** 2026-02-02  
**次回更新予定:** Phase 3完了時
