<template>
  <div class="replace-tab">
    <div class="replace-rules">
      <div 
        v-for="(rule, index) in localRules"
        :key="rule.id"
        class="rule-row"
      >
        <!-- ルールヘッダー（1行目） -->
        <div class="rule-header">
          <div class="rule-checkbox">
            <input 
              type="checkbox"
              :id="`rule-${rule.id}`"
              v-model="rule.enabled"
              @change="handleEnabledChange(index)"
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
        
        <!-- From入力（2行目） -->
        <div class="rule-input-row">
          <label class="input-label">From:</label>
          <input 
            type="text"
            v-model="rule.from"
            placeholder="Original text"
            @input="handleRuleChange(index)"
          />
        </div>
        
        <!-- To入力（3行目） -->
        <div class="rule-input-row">
          <label class="input-label">To:</label>
          <input 
            type="text"
            v-model="rule.to"
            placeholder="Replace with"
            @input="handleRuleChange(index)"
          />
          <div class="validation-indicator">
            <span 
              v-if="getValidationStatus(index) === 'valid'" 
              class="validation-icon valid"
              title="有効なルール"
            >
              ✓
            </span>
            <span 
              v-else-if="getValidationStatus(index) === 'invalid'" 
              class="validation-icon invalid"
              :title="getValidationReason(index) || '無効なルール'"
            >
              ?
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Download with Replaced ツール -->
    <div class="download-replaced-tool">
      <div class="download-replaced-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
        <span>Download with Replaced</span>
      </div>
      
      <div class="download-replaced-checkbox">
        <input 
          type="checkbox"
          id="download-replaced"
          class="checkbox-input"
          v-model="enableDownloadReplaced"
        />
        <label for="download-replaced" class="checkbox-label">
          Enable replaced VIL download
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
import type { ReplaceRule } from '../utils/types'

const settingsStore = useSettingsStore()

// Download with Replaced設定
const enableDownloadReplaced = ref(false)

// ローカルな作業用ルールリスト（未保存の変更を含む）
const localRules = ref<ReplaceRule[]>([])
// 保存済みルールリスト（比較用）
const savedRules = ref<ReplaceRule[]>([])

// ローカルルールを初期化
const initializeRules = () => {
  // 深いコピーで初期化
  localRules.value = settingsStore.replaceRules.map(rule => ({ ...rule }))
  savedRules.value = settingsStore.replaceRules.map(rule => ({ ...rule }))
  
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
  // reactivityを確実にトリガーするため、配列を再参照
  localRules.value = [...localRules.value]
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
  if (!localRule) return false
  
  const savedRule = savedRules.value.find(r => r.id === localRule.id)
  
  if (!savedRule) {
    // 新しいルールで内容がある場合（両方に値が入っている場合のみ）
    const hasChanges = localRule.from.trim() !== '' && localRule.to.trim() !== ''
    console.log(`[Debug] New rule ${index}: from="${localRule.from}", to="${localRule.to}", hasChanges=${hasChanges}`)
    return hasChanges
  }
  
  // 既存ルールの変更をチェック
  const hasChanges = (
    localRule.enabled !== savedRule.enabled ||
    localRule.from !== savedRule.from ||
    localRule.to !== savedRule.to
  )
  console.log(`[Debug] Existing rule ${index}: hasChanges=${hasChanges}, enabled=${localRule.enabled}/${savedRule.enabled}, from="${localRule.from}"/"${savedRule.from}", to="${localRule.to}"/"${savedRule.to}"`)
  return hasChanges
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
  
  // settingsStoreに変更を保存
  const validRules = savedRules.value.filter(r => r.from.trim() !== '' && r.to.trim() !== '')
  settingsStore.setReplaceRules(validRules)
  
  // バリデーション状態を更新
  settingsStore.updateReplaceRulesValidation()
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
    
    // settingsStoreに変更を保存
    const validRules = savedRules.value.filter(r => r.from !== '' || r.to !== '')
    settingsStore.setReplaceRules(validRules)
    
    // バリデーション状態を更新
    settingsStore.updateReplaceRulesValidation()
  }
  
  // 空のルールを追加
  addEmptyRuleIfNeeded()
}

// ルールのバリデーション状況を取得
const getValidationStatus = (index: number): 'valid' | 'invalid' | 'none' => {
  const rule = localRules.value[index]
  
  // 編集中（未保存の変更がある）場合はバリデーションを表示しない
  if (hasUnsavedChanges(index)) {
    return 'none'
  }
  
  // 保存済みルールの場合、リアルタイムでバリデーション実行
  const savedRule = savedRules.value.find(r => r.id === rule.id)
  if (savedRule) {
    return settingsStore.validateReplaceRule(rule)
  }
  
  return 'none'
}

// ルールのバリデーション理由を取得
const getValidationReason = (index: number): string => {
  const rule = localRules.value[index]
  
  // 編集中や未保存の場合は理由なし
  if (hasUnsavedChanges(index)) {
    return ''
  }
  
  // 保存済みルールの場合、詳細なバリデーション実行
  const savedRule = savedRules.value.find(r => r.id === rule.id)
  if (savedRule) {
    const result = settingsStore.validateReplaceRuleWithReason(rule)
    return result.reason || ''
  }
  
  return ''
}

// settingsStoreのreplaceRulesの変更を監視
watch(() => settingsStore.replaceRules, () => {
  initializeRules()
}, { immediate: true })
</script>

<style scoped lang="scss">
.replace-rules {
  padding-top: 6px;
  
  .rule-row {
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    &:first-child {
      padding-top: 0;
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .rule-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 170px;
  }
  
  .rule-input-row {
    display: flex;
    align-items: center;
    gap: 6px;
    max-width: 170px;
    
    .input-label {
      font-size: 12px;
      color: #6c757d;
      font-weight: 500;
      min-width: 30px;
      flex-shrink: 0;
    }
    
    input {
      flex: 1;
      padding: 4px 6px;
      border: 1px solid #ced4da;
      border-radius: 3px;
      font-size: 12px;
      background: white;
      color: black;
      transition: border-color 0.15s;
      box-sizing: border-box;
      min-width: 0;
      
      &:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.15);
      }
      
      &::placeholder {
        color: #9ca3af;
        font-size: 11px;
      }
    }
  }
  
  .validation-indicator {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .validation-icon {
      font-size: 10px;
      font-weight: bold;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.valid {
        color: #28a745;
        background: rgba(40, 167, 69, 0.1);
        border: 1px solid rgba(40, 167, 69, 0.3);
      }
      
      &.invalid {
        color: #dc3545;
        background: rgba(220, 53, 69, 0.1);
        border: 1px solid rgba(220, 53, 69, 0.3);
      }
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
  
  
  .rule-checkbox {
    flex-shrink: 0;
    
    input[type="checkbox"] {
      width: 14px;
      height: 14px;
      margin: 0;
      cursor: pointer;
    }
  }
  
  .rule-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    
    .btn {
      padding: 3px 8px;
      border: none;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      min-width: 35px;
      
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

/* Download with Replaced tool */
.download-replaced-tool {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  background: #fafbfc;
  box-sizing: border-box;
  max-width: 170px;
  position: relative;
  margin-top: 15px;
}

.download-replaced-title {
  position: absolute;
  top: -8px;
  left: 12px;
  background: #fafbfc;
  padding: 0 4px;
  font-size: 9px;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 3px;
  
  svg {
    color: #6c757d;
  }
}

.download-replaced-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.checkbox-input {
  width: 14px;
  height: 14px;
  margin: 0;
  cursor: pointer;
}

.checkbox-label {
  font-size: 10px;
  color: #495057;
  cursor: pointer;
  user-select: none;
  line-height: 1.2;
}

/* レスポンシブ対応を削除 - 常に一行表示を維持 */
</style>