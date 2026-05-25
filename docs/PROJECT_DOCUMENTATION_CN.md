# LUMIERA Backend 项目文档

## 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [核心功能模块](#核心功能模块)
- [配置与环境设置](#配置与环境设置)
- [API 文档](#api-文档)
- [开发指南](#开发指南)
- [部署指南](#部署指南)

---

## 项目概述

**LUMIERA** 是一个基于 Medusa v2 构建的高端亲密健康用品电商平台后端。该项目采用 Headless Commerce 架构，专注于私密配送、多货币支持（GBP、EUR、USD）以及通过邮件营销实现自动化客户参与。

### 项目基本信息

| 属性 | 值 |
|-------|-----|
| **项目名称** | lumiera-backend |
| **版本** | 1.0.0 |
| **描述** | LUMIERA - Premium Intimate Wellness E-commerce Backend |
| **许可证** | MIT |
| **Node.js 要求** | >= 20 |
| **主要语言** | TypeScript |

### 业务特点

- **私密配送**：所有产品均采用保密包装，保护客户隐私
- **多货币支持**：支持 GBP（默认）、EUR、USD 三种货币
- **自动营销**：新客户注册自动生成 15% 折扣码
- **多区域覆盖**：配送范围覆盖英国和欧盟国家
- **变体图片切换**：支持根据产品变体（颜色/尺寸）动态切换图片

---

## 技术栈

### 运行时环境

| 技术 | 版本 | 用途 |
|------|-------|-----|
| **Node.js** | >= 20 | JavaScript 运行时 |
| **TypeScript** | ^5.6.2 | 主要编程语言 |
| **Medusa Framework** | 2.12.4 | Headless Commerce 框架 |

### 核心依赖

| 包名 | 版本 | 用途 |
|-------|-------|-----|
| `@medusajs/medusa` | 2.12.4 | 核心 Medusa 框架 |
| `@medusajs/framework` | 2.12.4 | 框架工具 |
| `@medusajs/admin-sdk` | 2.12.4 | 管理面板 SDK |
| `@medusajs/cli` | 2.12.4 | 命令行工具 |

### 数据库与缓存

| 技术 | 版本 | 用途 |
|------|-------|-----|
| **PostgreSQL** | 16 | 主数据库（通过 Docker） |
| **Redis** | 7-alpine | 缓存和队列管理（通过 Docker） |

### 邮件服务

| 技术 | 版本 | 用途 |
|------|-------|-----|
| **Resend** | ^6.7.0 | 邮件服务提供商 |
| **React Email** | ^1.0.4 | 邮件模板 UI 组件 |
| **@react-email/render** | ^2.0.2 | 邮件模板渲染 |
| **Handlebars** | ^4.7.8 | 备用模板引擎 |

### 开发工具

| 工具 | 版本 | 用途 |
|------|-------|-----|
| **@swc/core** | ^1.7.28 | 快速 TypeScript/JavaScript 编译器 |
| **@swc/jest** | ^0.2.36 | Jest 的 SWC 转换器 |
| **vite** | ^5.4.14 | 管理面板构建工具 |
| **ts-node** | ^10.9.2 | Node.js 的 TypeScript 执行 |
| **jest** | ^29.7.0 | 测试框架 |
| **yalc** | ^1.0.0-pre.53 | 本地包链接工具 |

---

## 项目结构

### 架构模式

LUMIERA 采用 **Medusa v2 模块化、事件驱动架构**，包含以下层次：

```
┌─────────────────────────────────────────────┐
│         API 层 (REST 端点)            │
│         src/api/                        │
├─────────────────────────────────────────────┤
│       事件层 (订阅者)                 │
│       src/subscribers/                  │
├─────────────────────────────────────────────┤
│    工作流层 (业务流程)             │
│    src/workflows/                      │
├─────────────────────────────────────────────┤
│     模块层 (可复用逻辑)             │
│     src/modules/                       │
├─────────────────────────────────────────────┤
│    管理层 (Admin 扩展)            │
│    src/admin/                         │
└─────────────────────────────────────────────┘
```

### 目录结构详解

```
lumiera-backend/
├── src/                              # 源代码目录
│   ├── api/                           # 自定义 REST API 路由
│   │   ├── admin/
│   │   │   └── custom/route.ts         # Admin 健康检查端点
│   │   └── store/
│   │       ├── custom/route.ts          # Store 健康检查端点
│   │       ├── products/[id]/route.ts    # 商品详情 API（含变体图片）
│   │       ├── carts/[id]/route.ts       # 购物车 API（含变体图片）
│   │       └── test-email/route.ts       # 邮件测试端点
│   │
│   ├── modules/                        # 自定义模块
│   │   └── resend/
│   │       ├── index.ts                 # 模块定义
│   │       └── service.ts               # Resend 通知提供商
│   │
│   ├── workflows/                      # 工作流（业务流程编排）
│   │   └── steps/
│   │       └── delete-associated-auth-identities.ts  # 身份清理步骤
│   │
│   ├── subscribers/                    # 事件订阅者
│   │   ├── customer-created.ts        # 客户注册事件
│   │   ├── order-placed.ts            # 订单下单事件
│   │   └── cleanup-auth-identity.ts   # 身份清理事件
│   │
│   ├── admin/                          # 管理面板定制
│   │   ├── i18n/
│   │   │   └── index.ts              # 国际化（中文支持）
│   │   └── vite-env.d.ts
│   │
│   ├── scripts/                        # CLI 脚本
│   │   ├── seed.ts                   # 数据库种子数据
│   │   ├── create-admin.ts            # 创建管理员用户
│   │   ├── create-admin-user.ts        # 备用管理员创建脚本
│   │   ├── test-cart-endpoint.ts      # 测试购物车 API
│   │   └── ... (26+ 维护脚本)
│   │
│   ├── jobs/                           # 定时任务（当前为空）
│   ├── links/                          # 模块链接
│   └── emails/                         # React Email 模板
│       ├── customer_created.tsx        # 欢迎邮件
│       └── welcome.tsx                # 欢迎模板（重复）
│
├── data/                              # 数据目录
│   └── templates/                     # Handlebars 邮件模板
│       ├── customer_created/
│       └── order_placed/
│
├── static/                            # 静态文件
│   └── (20+ 产品图片 PNG)
│
├── integration-tests/                   # HTTP 集成测试
│   └── http/
│       └── health.spec.ts
│
├── .medusa/                          # Medusa 构建输出
├── node_modules/                      # 依赖包
│
├── package.json                       # 项目配置和依赖
├── tsconfig.json                     # TypeScript 配置
├── medusa-config.ts                  # Medusa 应用配置
├── docker-compose.yml                 # Docker 服务配置
├── jest.config.js                    # Jest 测试配置
├── .env.template                     # 环境变量模板
├── .env                              # 实际环境变量（敏感）
├── .env.test                         # 测试环境配置
├── .gitignore                        # Git 忽略规则
├── .npmrc                           # npm/yarn 配置
├── instrumentation.ts                 # OpenTelemetry 设置（已注释）
│
└── docs/                             # 项目文档（当前文件）
```

### 配置文件说明

| 文件 | 用途 |
|------|-----|
| `package.json` | 项目依赖、脚本、元数据 |
| `tsconfig.json` | TypeScript 编译配置（ES2021、装饰器启用） |
| `medusa-config.ts` | Medusa 框架配置（模块、CORS、数据库） |
| `docker-compose.yml` | Docker 服务（PostgreSQL 16、Redis 7） |
| `jest.config.js` | Jest 测试框架配置 |
| `.env.template` | 环境变量模板 |
| `.gitignore` | Git 忽略规则（`.env`、`node_modules` 等） |

---

## 核心功能模块

### 1. 商品与目录管理

**位置**: `src/scripts/seed.ts`（数据库种子）

#### 商品分类

1. **Solo Play（个人情趣）**
   - The Rose - 吸吮式按摩器（£79-99）
   - The Wand - 深层组织按摩器（£129-159）
   - The Curve - G 点按摩器（£89-109）

2. **Couples（情侣共享）**
   - The Ring - 震动情侣戒指（£49-59）
   - The Duo - 可穿戴情侣震动器（£119-149）

3. **Wellness（健康理疗）**
   - Kegel Trainer - 智能盆底肌训练器（£99-129）
   - Intimate Massage Oil - 有机植物按摩油（£24-49）

4. **Accessories（配件护理）**
   - Water-Based Lubricant - 水基润滑剂（£12-35）
   - Toy Cleaner - 抗菌喷雾（£9-11）
   - Satin Storage Pouch - 缎面收纳袋（£12-23）

#### 商品变体特性

- **多变体支持**：每个产品可配置多个颜色/尺寸变体
- **变体专属图片**：每个变体可拥有独立的图片集
- **多货币定价**：GBP（默认）、EUR、USD
- **智能降级**：变体无图片时自动降级到产品级图片

### 2. 自定义 Store API 端点

**位置**: `src/api/store/`

| 端点 | 方法 | 用途 | 关键特性 |
|--------|------|------|---------|
| `/store/products/{id}` | GET | 获取商品详情（含变体图片、价格、选项） | 支持通过 ID 或 handle 查询 |
| `/store/carts/{id}` | GET | 获取购物车详情（含变体图片、商品缩略图） | 完整购物车信息 |
| `/store/custom` | GET | Store 健康检查 | 状态端点 |
| `/store/test-email` | POST | 测试邮件发送功能 | 自定义邮件发送 |

#### 商品详情 API 示例

**请求**:
```http
GET /store/products/the-rose
Header: x-publishable-api-key: {your_key}
```

**响应**:
```json
{
  "product": {
    "id": "prod_01JEXAMPLE",
    "title": "The Rose",
    "subtitle": "Clitoral Suction Massager",
    "handle": "the-rose",
    "status": "published",
    "thumbnail": "https://...",
    "images": [...],
    "variants": [
      {
        "id": "variant_01JEXAMPLE",
        "title": "Dusty Rose",
        "sku": "ROSE-DR",
        "options": { "Color": "Dusty Rose" },
        "images": [...],           // 变体专属图片
        "prices": [
          { "amount": 7900, "currency_code": "gbp" },
          { "amount": 8900, "currency_code": "eur" }
        ]
      }
    ],
    "categories": [...]
  }
}
```

### 3. 客户参与与促销

**位置**: `src/subscribers/customer-created.ts`

#### 自动化欢迎流程

**触发事件**: `customer.created`

**业务逻辑**:
1. **生成唯一折扣码**: `WELCOME-{3位随机十六进制}`
2. **创建 15% 折扣活动**:
   - 类型：`standard`
   - 数值：`15%`（百分比）
   - 目标：`order`
   - 分配方式：`across`（跨商品）
   - 自动应用：`true`
   - 有效期：30 天
3. **发送欢迎邮件**（通过 Resend）:
   - 包含客户姓名
   - 显示折扣码
   - 包含有效期日期
   - CTA 按钮引导访问店铺

**实现代码片段**:
```typescript
// 生成折扣码
function generateDiscountCode(): string {
    const randomPart = randomBytes(3).toString("hex").toUpperCase()
    return `WELCOME-${randomPart}`
}

// 计算有效期
function getExpiryDate(): Date {
    const now = new Date()
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
}

// 创建促销
const promotions = await promotionModuleService.createPromotions({
    code: code,
    type: "standard",
    status: "active",
    is_automatic: true,
    application_method: {
        type: "percentage",
        value: 15,
        target_type: "order",
        allocation: "across",
    },
})
```

### 4. 订单管理

**位置**: `src/subscribers/order-placed.ts`

#### 订单确认流程

**触发事件**: `order.placed`

**业务逻辑**:
1. **获取订单详情**: 订单 ID、总额、邮箱、货币、显示 ID
2. **发送订单确认邮件**: 通过通知模块
3. **格式化订单总额**: 将最小货币单位转换为可读格式

### 5. 邮件通知系统（自定义模块）

**位置**: `src/modules/resend/`

#### 模块架构

- **基类**: `AbstractNotificationProviderService`（Medusa 核心）
- **服务提供商**: Resend API（`resend` npm 包）

#### 支持的邮件模板

1. **`customer_created`** - 欢迎邮件
   - **内联 HTML 模板**（高级样式）
   - 包含折扣码显示框
   - 响应式设计
   - 品牌化页眉和页脚

2. **`order_placed`** - 订单确认
   - 使用 Handlebars 回退模板

#### 模块配置（`medusa-config.ts`）

```typescript
modules: [
  {
    resolve: "./src/modules/resend",
    id: "resend",
    options: {
      channels: ["email"],
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL,
    },
  },
],
```

### 6. 身份认证管理

**位置**:
- `src/subscribers/cleanup-auth-identity.ts`
- `src/workflows/steps/delete-associated-auth-identities.ts`

#### 自动清理流程

**触发事件**: `customer.deleted`

**业务逻辑**:
1. **查询客户邮箱**: 通过客户 ID 获取邮箱地址
2. **查找身份**: 通过邮箱查找关联的 AuthIdentities
3. **批量删除**: 删除所有关联的身份标识
4. **补偿逻辑**: 记录删除操作（用于工作流回滚）

### 7. 配送与履约

**位置**: `src/scripts/seed.ts`

#### 配送配置

| 配送方式 | 描述 | GBP | EUR | USD |
|---------|------|-----|-----|-----|
| Discreet Standard | 3-5 个工作日 | £4.99 | €5.99 | $6.99 |
| Discreet Express | 次个工作日 | £9.99 | €11.99 | $13.99 |
| Free Shipping | 订单超过 £75 | FREE | FREE | FREE |

#### 服务区域

- **区域名称**：UK & Europe
- **覆盖国家**：
  - 英国：GB
  - 欧盟：DE、DK、SE、FR、ES、IT、NL、BE

#### 配送资料

- **配送资料**：LUMIERA Discreet Shipping
- **履约商**：`manual_manual`（系统默认）
- **库存位置**：LUMIERA UK Warehouse（伦敦）

### 8. 区域与税务配置

#### 区域配置

| 区域 | 货币 | 国家 |
|------|-------|------|
| United Kingdom | GBP（默认） | GB |
| Europe | EUR | DE、DK、SE、FR、ES、IT、NL、BE |

#### 税务提供商

- **提供商**：`tp_system`（Medusa 系统税务提供商）
- **自动配置**：所有国家自动创建税区

### 9. 店铺配置

| 配置项 | 值 |
|--------|-----|
| **店铺名称** | LUMIERA |
| **默认销售渠道** | LUMIERA Storefront |
| **支持货币** | GBP（默认）、EUR、USD |
| **默认库存位置** | LUMIERA UK Warehouse |
| **Publishable API Key** | 自动生成（用于前台集成） |

### 10. CLI 脚本（管理工具）

**位置**: `src/scripts/`

| 脚本 | 用途 |
|--------|------|
| `seed.ts` | 完整店铺数据种子（商品、区域、配送、库存） |
| `create-admin.ts` | 程序化创建管理员用户 |
| `create-admin-user.ts` | 备用管理员创建脚本（含身份处理） |
| `test-cart-endpoint.ts` | 测试购物车 API（含变体图片检索） |
| `test-promotion.ts` | 测试促销创建（含生成码） |
| `fix-duo-*.ts` | Duo 产品各种修复脚本 |
| `fix-variant-*.ts` | 变体图片/缩略图修复 |
| `delete-user.ts` | 用户删除工具 |
| `delete-all-customers.ts` | 批量删除客户工具 |

---

## 配置与环境设置

### 环境变量

**模板文件**: `.env.template`

```bash
# 数据库配置
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medusa-lumiera

# Redis 配置
REDIS_URL=redis://localhost:6379

# CORS 配置
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:7001
AUTH_CORS=http://localhost:3000,http://localhost:7001

# 安全密钥
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret

# 邮件配置
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@lumierawellness.com

# Medusa 配置
MEDUSA_BACKEND_URL=http://localhost:9000
```

### 安全配置

#### JWT 与 Cookie 密钥

**生产环境强制检查**（`medusa-config.ts`）:
```typescript
if (process.env.NODE_ENV === 'production') {
  if (jwtSecret === "supersecret" || cookieSecret === "supersecret") {
    throw new Error("❌ SECURITY ERROR: JWT_SECRET and COOKIE_SECRET must be set in production and cannot be 'supersecret'.")
  }
}
```

**开发环境警告**:
```typescript
if (jwtSecret === "supersecret" || cookieSecret === "supersecret") {
  console.warn("⚠️  SECURITY WARNING: Using default insecure secrets. Ensure JWT_SECRET and COOKIE_SECRET are set in production.")
}
```

### CORS 配置

| CORS 类型 | 默认值 |
|----------|---------|
| **Store CORS** | `http://localhost:3000` |
| **Admin CORS** | `http://localhost:7001` |
| **Auth CORS** | `http://localhost:3000,http://localhost:7001` |

### 测试配置

**文件**: `jest.config.js`

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@medusajs/(.+)$": "<rootDir>/node_modules/@medusajs/$1",
  },
}
```

**测试命令**:
```bash
# HTTP 集成测试
npm run test:integration:http

# 模块集成测试
npm run test:integration:modules

# 单元测试
npm run test:unit
```

---

## API 文档

### 认证

所有 Store API 请求需要在 Header 中包含 Publishable API Key：

```http
x-publishable-api-key: {your_publishable_key}
```

### 商品详情 API

**端点**: `GET /store/products/{productId}`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `productId` | string | 是 | 商品 ID 或 handle |

**响应字段说明**:

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `product.id` | string | 商品唯一标识 |
| `product.title` | string | 商品名称 |
| `product.subtitle` | string | 商品副标题 |
| `product.description` | string | 商品详细描述 |
| `product.handle` | string | URL 友好的商品标识 |
| `product.thumbnail` | string | 商品缩略图 URL |
| `product.images` | array | 商品图片列表 |
| `product.variants` | array | 商品变体列表 |
| `product.variants[].images` | array | **变体专属图片**（用于图片切换） |
| `product.variants[].options` | object | 变体选项（如颜色、尺寸） |
| `product.variants[].prices` | array | 变体价格（不同货币） |
| `product.categories` | array | 商品分类列表 |

### 购物车 API

**端点**: `GET /store/carts/{cartId}`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `cartId` | string | 是 | 购物车 ID |

**响应字段说明**:

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `cart.id` | string | 购物车唯一标识 |
| `cart.email` | string | 客户邮箱 |
| `cart.currency_code` | string | 货币代码（gbp/eur/usd） |
| `cart.items` | array | 购物车商品列表 |
| `cart.items[].quantity` | number | 商品数量 |
| `cart.items[].unit_price` | number | 单价（最小货币单位） |
| `cart.items[].subtotal` | number | 小计（最小货币单位） |
| `cart.items[].variant` | object | 变体详细信息 |
| `cart.items[].variant.images` | array | **变体图片**（用于显示） |
| `cart.items[].variant.product` | object | 关联的商品信息 |
| `cart.items[].variant.product.thumbnail` | string | 商品缩略图 |

### 价格说明

所有价格以**最小货币单位**表示：
- 例如：`7900` = £79.00 GBP

显示时需除以 100：
```javascript
const price = (product.prices[0].amount / 100).toFixed(2)
// 结果: "79.00"
```

### 错误处理

所有错误响应遵循统一格式：

```json
{
  "type": "error_type",
  "message": "Error description"
}
```

**常见错误码**:

| HTTP 状态码 | 错误类型 | 说明 |
|------------|---------|------|
| 400 | `invalid_request` | 请求参数错误 |
| 401 | `unauthorized` | 缺少或无效的 API Key |
| 404 | `not_found` | 资源不存在 |
| 500 | `internal_error` | 服务器内部错误 |

---

## 开发指南

### 启动开发服务器

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 或
npx medusa develop
```

**默认端口**: 9000

### 数据库迁移

```bash
# 生成迁移
npx medusa db:generate

# 运行迁移
npx medusa db:migrate
```

### 运行种子数据

```bash
npm run seed
# 或
npx medusa exec ./src/scripts/seed.ts
```

### 构建生产版本

```bash
npm run build
# 或
npx medusa build
```

### 启动生产服务器

```bash
npm start
# 或
npx medusa start
```

### Docker 部署

```bash
# 启动数据库服务
docker-compose up -d postgres redis
```

### 代码规范

- 使用 TypeScript 进行类型安全
- 遵循 Medusa v2 模块化模式
- 使用文件基础路由（`src/api/`）
- 使用订阅者处理事件（`src/subscribers/`）
- 使用工作流编排复杂业务流程（`src/workflows/`）

---

## 部署指南

### 前置要求

- Node.js >= 20
- PostgreSQL 16
- Redis 7
- Resend API Key（用于邮件发送）

### 生产环境检查清单

- [ ] 设置强 `JWT_SECRET` 和 `COOKIE_SECRET`
- [ ] 配置正确的 `DATABASE_URL`（生产数据库）
- [ ] 配置 `REDIS_URL`（生产 Redis）
- [ ] 设置 `RESEND_API_KEY` 和 `RESEND_FROM_EMAIL`
- [ ] 配置正确的 CORS 源（生产域名）
- [ ] 运行数据库迁移
- [ ] 运行种子数据（如需要）
- [ ] 构建应用
- [ ] 启动生产服务器

### 环境变量示例（生产）

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@production-host:5432/lumiera
REDIS_URL=redis://production-redis-host:6379
STORE_CORS=https://store.lumiera.com
ADMIN_CORS=https://admin.lumiera.com
AUTH_CORS=https://store.lumiera.com,https://admin.lumiera.com
JWT_SECRET=<strong-random-string>
COOKIE_SECRET=<strong-random-string>
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@lumierawellness.com
MEDUSA_BACKEND_URL=https://api.lumiera.com
```

---

## 变体图片切换功能

### 功能概述

后端已支持 `variant.images` 字段，前端可以实现根据用户选择的变体（如颜色、尺寸）动态切换商品图片。

### 前端集成示例

#### React 示例

```jsx
import { useState } from 'react';

function ProductPage({ product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);

  // 获取当前变体的图片，如果没有则使用产品图片
  const currentImages = selectedVariant.images?.length > 0
    ? selectedVariant.images
    : product.images;

  return (
    <div>
      {/* 图片展示 */}
      <div className="product-images">
        {currentImages.map(img => (
          <img key={img.id} src={img.url} alt={product.title} />
        ))}
      </div>

      {/* 变体选择器 */}
      <div className="variant-selector">
        {product.variants.map(variant => (
          <button
            key={variant.id}
            onClick={() => setSelectedVariant(variant)}
            className={selectedVariant.id === variant.id ? 'active' : ''}
          >
            {variant.title}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 注意事项

1. **降级处理**：如果变体没有专属图片，使用产品级别的图片
2. **缓存**：考虑缓存图片以提升性能
3. **预加载**：可以预加载所有变体图片以实现无缝切换
4. **响应式**：确保图片在不同设备上正确显示

---

## 故障排查

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 是否正确
   - 确认 PostgreSQL 服务正在运行
   - 检查防火墙设置

2. **邮件发送失败**
   - 验证 `RESEND_API_KEY` 是否有效
   - 检查 `RESEND_FROM_EMAIL` 是否已验证
   - 查看 Resend 控制台的错误日志

3. **CORS 错误**
   - 确认 CORS 配置包含前端域名
   - 检查 `STORE_CORS`、`ADMIN_CORS`、`AUTH_CORS` 设置

4. **构建失败**
   - 清理 `.medusa` 缓存目录
   - 删除 `node_modules` 并重新安装依赖
   - 确认 Node.js 版本 >= 20

### 日志

开发模式日志会输出到控制台，包括：
- `[Resend]` - 邮件发送日志
- `[CustomerCreatedSubscriber]` - 客户创建日志
- `[OrderPlacedSubscriber]` - 订单下单日志
- `[Auto-Cleanup]` - 身份清理日志

---

## 维护脚本说明

### 使用示例

#### 创建管理员用户

```bash
npx medusa exec ./src/scripts/create-admin-user.ts --email admin@lumiera.com --password securepassword123
```

#### 修复变体图片

```bash
npx medusa exec ./src/scripts/fix-variant-thumbnails.ts
```

#### 测试购物车 API

```bash
npx medusa exec ./src/scripts/test-cart-endpoint.ts
```

---

## 测试

### 集成测试

**位置**: `integration-tests/http/health.spec.ts`

```bash
# 运行 HTTP 集成测试
npm run test:integration:http
```

### 测试覆盖

- ✅ 健康检查端点
- ✅ 商品详情 API（含变体图片）
- ✅ 购物车 API（含变体图片）
- ✅ 客户注册流程
- ✅ 促销创建
- ✅ 邮件发送

---

## 贡献指南

### 开发流程

1. Fork 项目仓库
2. 创建功能分支（`git checkout -b feature/your-feature`）
3. 进行开发
4. 运行测试确保功能正常
5. 提交更改（`git commit -m 'Add feature'`）
6. 推送到分支（`git push origin feature/your-feature`）
7. 创建 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循现有代码风格
- 编写必要的注释
- 确保类型安全

---

## 附录

### 支持的货币

| 货币代码 | 货币名称 | 符号 |
|---------|---------|------|
| `gbp` | 英镑 | £ |
| `eur` | 欧元 | € |
| `usd` | 美元 | $ |

### 覆盖国家

| 代码 | 国家 |
|------|------|
| GB | 英国 |
| DE | 德国 |
| DK | 丹麦 |
| SE | 瑞典 |
| FR | 法国 |
| ES | 西班牙 |
| IT | 意大利 |
| NL | 荷兰 |
| BE | 比利时 |

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-10
**项目版本**: 1.0.0
**Medusa 版本**: 2.12.4
