<template>
  <div class="replace-tab">
    <div class="replace-rules">
      <div 
        v-for="(rule, index) in localRules"
        :key="rule.id"
        class="rule-row"
      >
        <div class="rule-checkbox">
          <input 
            type="checkbox"
            :id="`rule-${rule.id}`"
            v-model="rule.enabled"
            @change="handleEnabledChange(index)"
          />
          <label :for="`rule-${rule.id}`"></label>
        </div>
        
        <div class="rule-input">
          <input 
            type="text"
            v-model="rule.from"
            placeholder="From"
            @input="handleRuleChange(index)"
          />
        </div>
        
        <div class="rule-input">
          <input 
            type="text"
            v-model="rule.to"
            placeholder="To"
            @input="handleRuleChange(index)"
          />
        </div>
        
        <div class="rule-actions">
          <button 
            class="btn btn-save"
            @click="saveRule(index)"
            :disabled="!hasUnsavedChanges(index)"
          >
            Save
          </button>
          <button 
            class="btn btn-delete"
            @click="deleteRule(index)"
            :disabled="isLastEmptyRule(index)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ReplaceRule } from './AdvancedSettings.vue'

const props = defineProps<{
  replaceRules: ReplaceRule[]
}>()

const emit = defineEmits<{
  rulesChanged: [rules: ReplaceRule[]]
}>()

// ローカルな作業用ルールリスト（未保存の変更を含む）
const localRules = ref<ReplaceRule[]>([])
// 保存済みルールリスト（比較用）
const savedRules = ref<ReplaceRule[]>([])

// ローカルルールを初期化
const initializeRules = () => {
  localRules.value = [...props.replaceRules]
  savedRules.value = [...props.replaceRules]
  
  // 最後が空のルールでない場合、空のルールを追加
  addEmptyRuleIfNeeded()
}

// 空のルールを追加（最後のルールが空でない場合）
const addEmptyRuleIfNeeded = () => {
  const lastRule = localRules.value[localRules.value.length - 1]
  if (!lastRule || lastRule.from !== '' || lastRule.to !== '') {
    const newRule: ReplaceRule = {
      id: generateId(),
      enabled: true, // デフォルトで有効
      from: '',
      to: ''
    }
    localRules.value.push(newRule)
  }
}

// ユニークIDを生成
const generateId = (): string => {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ルールに変更があったときの処理
const handleRuleChange = async (index: number) => {
  await nextTick()
  addEmptyRuleIfNeeded()
}

// チェックボックス変更時の自動保存処理
const handleEnabledChange = async (index: number) => {
  const rule = localRules.value[index]
  
  // 既存のルールで有効無効の変更の場合は自動保存
  const savedRule = savedRules.value.find(r => r.id === rule.id)
  if (savedRule && (rule.from !== '' || rule.to !== '')) {
    saveRule(index)
  }
  
  await handleRuleChange(index)
}

// 未保存の変更があるかチェック
const hasUnsavedChanges = (index: number): boolean => {
  const localRule = localRules.value[index]
  const savedRule = savedRules.value.find(r => r.id === localRule.id)
  
  if (!savedRule) {
    // 新しいルールで内容がある場合（両方に値が入っている場合のみ）
    return localRule.from.trim() !== '' && localRule.to.trim() !== ''
  }
  
  // 既存ルールの変更をチェック
  return (
    localRule.enabled !== savedRule.enabled ||
    localRule.from !== savedRule.from ||
    localRule.to !== savedRule.to
  )
}

// 最後の空のルールかどうかチェック
const isLastEmptyRule = (index: number): boolean => {
  const rule = localRules.value[index]
  const isLast = index === localRules.value.length - 1
  const isEmpty = rule.from === '' && rule.to === ''
  return isLast && isEmpty
}

// ルールを保存
const saveRule = (index: number) => {
  const rule = localRules.value[index]
  
  // バリデーション: 両方のフィールドに値が入っている場合のみ保存
  if (rule.from.trim() === '' || rule.to.trim() === '') {
    console.log('Both from and to fields must be filled to save')
    return
  }
  
  // 保存済みリストを更新
  const savedIndex = savedRules.value.findIndex(r => r.id === rule.id)
  if (savedIndex >= 0) {
    savedRules.value[savedIndex] = { ...rule }
  } else {
    savedRules.value.push({ ...rule })
  }
  
  // 親コンポーネントに変更を通知
  const validRules = savedRules.value.filter(r => r.from.trim() !== '' && r.to.trim() !== '')
  emit('rulesChanged', validRules)
}

// ルールを削除
const deleteRule = (index: number) => {
  const rule = localRules.value[index]
  
  // ローカルリストから削除
  localRules.value.splice(index, 1)
  
  // 保存済みリストからも削除
  const savedIndex = savedRules.value.findIndex(r => r.id === rule.id)
  if (savedIndex >= 0) {
    savedRules.value.splice(savedIndex, 1)
    
    // 親コンポーネントに変更を通知
    const validRules = savedRules.value.filter(r => r.from !== '' || r.to !== '')
    emit('rulesChanged', validRules)
  }
  
  // 空のルールを追加
  addEmptyRuleIfNeeded()
}

// propsの変更を監視
watch(() => props.replaceRules, () => {
  initializeRules()
}, { immediate: true })
</script>

<style scoped lang="scss">
.replace-rules {
  padding-top: 8px;
  
  .rule-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
    min-height: 40px;
    border-bottom: 1px solid #e9ecef;
    
    &:first-child {
      padding-top: 0;
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .rule-checkbox {
    flex-shrink: 0;
    
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      margin: 0;
      cursor: pointer;
    }
  }
  
  .rule-input {
    flex: 0 0 90px;
    min-width: 90px;
    max-width: 90px;
    
    input {
      width: 90px;
      padding: 5px 6px;
      border: 1px solid #ced4da;
      border-radius: 3px;
      font-size: 12px;
      transition: border-color 0.15s;
      box-sizing: border-box;
      
      &:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
      }
      
      &::placeholder {
        color: #9ca3af;
        font-size: 11px;
      }
    }
  }
  
  .rule-actions {
    flex-shrink: 0;
    display: flex;
    gap: 4px;
    margin-left: 8px;
    
    .btn {
      padding: 4px 8px;
      border: none;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      min-width: 40px;
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &.btn-save {
        background: #28a745;
        color: white;
        
        &:hover:not(:disabled) {
          background: #218838;
        }
      }
      
      &.btn-delete {
        background: #dc3545;
        color: white;
        
        &:hover:not(:disabled) {
          background: #c82333;
        }
      }
    }
  }
}

/* レスポンシブ対応を削除 - 常に一行表示を維持 */
</style>