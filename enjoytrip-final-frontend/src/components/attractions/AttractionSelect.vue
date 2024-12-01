<script setup>
import {ref, watch} from 'vue';
const props = defineProps(
    {
        selectOption: Array,
        selected: Number
    });
const emit = defineEmits(["update:selected"]);

const key = ref(props.selected || 0);

// selected 값 변경에 따라 key 값도 변경
watch(() => props.selected, (newValue) => {
    key.value = newValue;
});

const onSelect = () => {
    emit("update:selected", key.value);
}

</script>

<template>
    <select v-model="key" @change="onSelect">
        <option
        v-for="option in selectOption"
        :key = "option.value"
        :value = "option.value"
        >{{ option.text }}</option>
    </select>
</template>

<style scoped>

</style>