<template>
  <div class="order-panel">
    <h2>🍴 주문하기</h2>

    <div class="menu-categories">
      <button
        v-for="category in categories"
        :key="category.id"
        :class="{ active: selectedCategory === category.id }"
        @click="selectedCategory = category.id"
        class="category-btn"
      >
        {{ category.icon }} {{ category.name }}
      </button>
    </div>

    <div class="menu-grid">
      <div
        v-for="item in filteredMenu"
        :key="item.id"
        class="menu-item"
        @click="orderItem(item)"
      >
        <div class="menu-icon">{{ item.icon }}</div>
        <div class="menu-name">{{ item.name }}</div>
        <div class="menu-price">{{ item.price.toLocaleString() }}원</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const emit = defineEmits<{
  order: [orderData: any];
}>();

const selectedCategory = ref("drink");

const categories = [
  { id: "drink", name: "음료", icon: "☕" },
  { id: "snack", name: "스낵", icon: "🍿" },
  { id: "meal", name: "식사", icon: "🍜" },
];

const menuItems = [
  { id: 1, category: "drink", name: "아메리카노", price: 4500, icon: "☕" },
  { id: 2, category: "drink", name: "카페라떼", price: 5000, icon: "☕" },
  { id: 3, category: "drink", name: "콜라", price: 3000, icon: "🥤" },
  { id: 4, category: "drink", name: "사이다", price: 3000, icon: "🥤" },
  { id: 5, category: "snack", name: "감자튀김", price: 6000, icon: "🍟" },
  { id: 6, category: "snack", name: "치킨너겟", price: 7000, icon: "🍗" },
  { id: 7, category: "snack", name: "팝콘", price: 5000, icon: "🍿" },
  { id: 8, category: "meal", name: "김치볶음밥", price: 9000, icon: "🍚" },
  { id: 9, category: "meal", name: "라면", price: 6000, icon: "🍜" },
  { id: 10, category: "meal", name: "떡볶이", price: 7000, icon: "🍢" },
];

const filteredMenu = computed(() => {
  return menuItems.filter((item) => item.category === selectedCategory.value);
});

const orderItem = (item: any) => {
  emit("order", {
    menu: item.name,
    price: item.price,
    category: item.category,
  });
};
</script>
