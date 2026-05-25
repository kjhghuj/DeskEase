# Lumiera Store API 文档

**Base URL**: `http://localhost:9000`  
**版本**: v1.0  
**最后更新**: 2026-01-21

---

## 目录
- [认证](#认证)
- [邮箱注册检查 API](#邮箱注册检查-api)
- [商品详情 API](#商品详情-api)
- [购物车 API](#购物车-api)
- [错误处理](#错误处理)

---

## 认证

所有 Store API 请求需要在 Header 中包含 Publishable API Key：

```
x-publishable-api-key: {your_publishable_key}
```

---

## 邮箱注册检查 API

### 检查邮箱是否已注册

检查指定邮箱地址是否已在系统中注册。

**端点**: `POST /store/check-email`

**请求 Body**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 要检查的邮箱地址 |

**请求示例**:
```bash
curl -X POST http://localhost:9030/store/check-email \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: YOUR_API_KEY" \
  -d '{"email": "user@example.com"}'
```

**响应示例**:
```json
{
  "email": "user@example.com",
  "is_registered": true
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `email` | string | 查询的邮箱地址（小写） |
| `is_registered` | boolean | `true` 表示已注册，`false` 表示未注册 |

**使用场景**:
- 订单确认页：判断是否显示"创建账号"表单
- 注册页：实时检查邮箱是否可用
- 登录页：提示用户是否需要先注册

---

## 商品详情 API

### 获取商品详情

获取单个商品的完整信息，包括变体、图片、价格等。

**端点**: `GET /store/products/{productId}`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `productId` | string | 是 | 商品 ID 或 handle |

**请求示例**:
```bash
GET /store/products/the-rose
# 或
GET /store/products/prod_01JEXAMPLE
```

**响应示例**:
```json
{
  "product": {
    "id": "prod_01JEXAMPLE",
    "title": "The Rose",
    "subtitle": "Clitoral Suction Massager",
    "description": "Experience the gentle embrace of The Rose...",
    "handle": "the-rose",
    "status": "published",
    "thumbnail": "https://images.unsplash.com/photo-1616627561950-9f8405d7b972?auto=format&fit=crop&q=80&w=800",
    "images": [
      {
        "id": "img_01JEXAMPLE1",
        "url": "https://images.unsplash.com/photo-1616627561950-9f8405d7b972?auto=format&fit=crop&q=80&w=800"
      },
      {
        "id": "img_01JEXAMPLE2",
        "url": "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?auto=format&fit=crop&q=80&w=800"
      }
    ],
    "variants": [
      {
        "id": "variant_01JEXAMPLE1",
        "title": "Dusty Rose",
        "sku": "ROSE-DR",
        "options": {
          "Color": "Dusty Rose"
        },
        "images": [
          {
            "id": "img_01JEXAMPLE1",
            "url": "https://images.unsplash.com/photo-1616627561950-9f8405d7b972?auto=format&fit=crop&q=80&w=800"
          }
        ],
        "prices": [
          {
            "id": "price_01JEXAMPLE",
            "amount": 7900,
            "currency_code": "gbp"
          },
          {
            "id": "price_01JEXAMPLE2",
            "amount": 8900,
            "currency_code": "eur"
          }
        ]
      },
      {
        "id": "variant_01JEXAMPLE2",
        "title": "Midnight Black",
        "sku": "ROSE-MB",
        "options": {
          "Color": "Midnight Black"
        },
        "images": [
          {
            "id": "img_01JEXAMPLE2",
            "url": "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?auto=format&fit=crop&q=80&w=800"
          }
        ],
        "prices": [
          {
            "amount": 7900,
            "currency_code": "gbp"
          }
        ]
      }
    ],
    "categories": [
      {
        "id": "cat_01JEXAMPLE",
        "name": "Solo Play",
        "handle": "solo-play"
      }
    ]
  }
}
```

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

**价格说明**:
- 所有价格以**最小货币单位**表示
- 例如：`7900` = £79.00 GBP

---

## 购物车 API

### 获取购物车详情

获取购物车的完整信息，包括商品、变体、图片等。

**端点**: `GET /store/carts/{cartId}`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `cartId` | string | 是 | 购物车 ID |

**请求示例**:
```bash
GET /store/carts/cart_01JEXAMPLE
```

**响应示例**:
```json
{
  "cart": {
    "id": "cart_01JEXAMPLE",
    "email": "customer@example.com",
    "currency_code": "gbp",
    "region_id": "reg_01JEXAMPLE",
    "items": [
      {
        "id": "item_01JEXAMPLE",
        "title": "The Rose - Dusty Rose",
        "quantity": 2,
        "unit_price": 7900,
        "subtotal": 15800,
        "variant_id": "variant_01JEXAMPLE",
        "variant": {
          "id": "variant_01JEXAMPLE",
          "title": "Dusty Rose",
          "sku": "ROSE-DR",
          "options": {
            "Color": "Dusty Rose"
          },
          "images": [
            {
              "id": "img_01JEXAMPLE",
              "url": "https://images.unsplash.com/photo-1616627561950-9f8405d7b972?auto=format&fit=crop&q=80&w=800"
            }
          ],
          "product": {
            "id": "prod_01JEXAMPLE",
            "title": "The Rose",
            "handle": "the-rose",
            "thumbnail": "https://images.unsplash.com/photo-1616627561950-9f8405d7b972?auto=format&fit=crop&q=80&w=800"
          }
        }
      }
    ]
  }
}
```

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

---

## 错误处理

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

**错误示例**:
```json
{
  "type": "not_found",
  "message": "Product not found"
}
```

---

## 前端集成示例

### 商品详情页 - 变体图片切换

```javascript
// 获取商品详情
const response = await fetch('/store/products/the-rose', {
  headers: {
    'x-publishable-api-key': 'YOUR_API_KEY'
  }
});
const { product } = await response.json();

// 选择变体时切换图片
function onVariantChange(variantId) {
  const variant = product.variants.find(v => v.id === variantId);
  
  // 使用变体图片，如果没有则降级到产品图片
  const images = variant.images?.length > 0 
    ? variant.images 
    : product.images;
  
  displayImages(images);
}
```

### 购物车页面 - 显示商品信息

```javascript
// 获取购物车
const response = await fetch('/store/carts/cart_123', {
  headers: {
    'x-publishable-api-key': 'YOUR_API_KEY'
  }
});
const { cart } = await response.json();

// 渲染购物车商品
cart.items.forEach(item => {
  const thumbnail = item.variant.images?.[0]?.url 
    || item.variant.product.thumbnail;
  
  const price = (item.unit_price / 100).toFixed(2);
  
  console.log(`${item.title} - £${price} x ${item.quantity}`);
  console.log(`Image: ${thumbnail}`);
});
```

---

## 支持的货币

| 货币代码 | 货币名称 | 符号 |
|---------|---------|------|
| `gbp` | 英镑 | £ |
| `eur` | 欧元 | € |
| `usd` | 美元 | $ |

---

## 开发提示

1. **变体图片**: 每个变体可以有专属图片，用于实现颜色/款式切换时的图片更新
2. **降级处理**: 如果变体没有图片，使用产品级别的图片
3. **价格格式**: 记得将价格除以 100 来显示（7900 → £79.00）
4. **缓存**: 建议缓存商品数据以提升性能
5. **CORS**: 开发环境已配置 CORS，生产环境需要配置允许的域名

---

**文档版本**: 1.0  
**技术支持**: 如有问题请联系后端团队
