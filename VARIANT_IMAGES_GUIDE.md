# 变体图片切换功能 - 前端集成指南

## 概述
后端已支持 `variant.images` 字段，前端可以实现根据用户选择的变体（如颜色、尺寸）动态切换商品图片。

## API 端点

### 1. 获取商品详情（含变体图片）
```
GET /store/products/{productId}
```

**响应结构**：
```javascript
{
  product: {
    id: "prod_123",
    title: "The Rose",
    thumbnail: "https://...",
    images: [...],  // 产品级别图片
    variants: [
      {
        id: "variant_123",
        title: "Dusty Rose",
        images: [...],  // ✅ 变体专属图片
        prices: [...]
      }
    ]
  }
}
```

### 2. 购物车（含变体图片）
```
GET /store/carts/{cartId}
```

**响应结构**：
```javascript
{
  cart: {
    items: [
      {
        variant: {
          id: "variant_123",
          title: "Dusty Rose",
          images: [...],  // ✅ 变体图片
          product: {
            thumbnail: "https://..."
          }
        }
      }
    ]
  }
}
```

## 前端实现示例

### React 示例
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

### Vue 示例
```vue
<template>
  <div>
    <!-- 图片展示 -->
    <div class="product-images">
      <img 
        v-for="img in currentImages" 
        :key="img.id" 
        :src="img.url" 
        :alt="product.title"
      />
    </div>

    <!-- 变体选择器 -->
    <div class="variant-selector">
      <button
        v-for="variant in product.variants"
        :key="variant.id"
        @click="selectedVariant = variant"
        :class="{ active: selectedVariant.id === variant.id }"
      >
        {{ variant.title }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps(['product']);
const selectedVariant = ref(props.product.variants[0]);

const currentImages = computed(() => {
  return selectedVariant.value.images?.length > 0
    ? selectedVariant.value.images
    : props.product.images;
});
</script>
```

## 注意事项

1. **降级处理**: 如果变体没有专属图片，使用产品级别的图片
2. **缓存**: 考虑缓存图片以提升性能
3. **预加载**: 可以预加载所有变体图片以实现无缝切换
4. **响应式**: 确保图片在不同设备上正确显示

## 测试建议

1. 测试有变体图片的产品
2. 测试没有变体图片的产品（应降级到产品图片）
3. 测试快速切换变体时的图片加载
