window.__ModuleLoader__.load({
  id: '@local/dsh-context-handoff',
  factory(require) {
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useRef, useState } = React

    const NS = 'contextHandoff'

    const EN = {
      'meta.title': 'Conversation context',
      'meta.description': 'Capture a conversation’s setting and background in an AI-written brief, then start a clean conversation with that context.',
      'settings.label': 'Conversation context',
      'settings.title': 'Conversation context',
      'settings.description': 'Distill the established setting, rules, decisions, and current state into a reviewable context brief. The new conversation receives the background only; it does not resume the old task.',
      'settings.storage': 'Context briefs are stored in a dedicated data folder and survive restarts.',
      'header.tooltip': 'Load conversation context',
      'dialog.title': 'Conversation context',
      'dialog.subtitle': 'Keep the setting and background, without carrying over the old task.',
      'dialog.close': 'Close',
      'side.title': 'Saved context briefs',
      'side.new': 'New context brief',
      'side.search': 'Search context briefs',
      'side.empty': 'No saved context briefs yet.',
      'side.emptyHint': 'Create one from a conversation to get started.',
      'side.noMatches': 'No matching context briefs.',
      'side.count': '{count} saved',
      'source.label': 'Source conversation',
      'source.choose': 'Choose a conversation',
      'source.current': 'Current conversation',
      'source.blank': 'This conversation has no messages yet. Send a message first.',
      'source.emptyOption': 'empty',
      'source.noSessions': 'No conversation is available. Open a conversation first.',
      'source.messages': '{count} messages',
      'focus.label': 'Focus (optional)',
      'focus.placeholder': 'For example: preserve the project background, rules, API decisions, and technical setup.',
      'generate': 'Generate context brief',
      'generating': 'Reading the conversation and writing the context brief…',
      'generating.button': 'Generating…',
      'generating.hint': 'Long conversations are summarized in slices, so this can take a minute.',
      'generating.wait': 'Still working. Very long conversations take longer.',
      'generating.cancel': 'Cancel generation',
      'generating.closeHint': 'Closing this window cancels the generation.',
      'privacy': 'The new conversation receives only the generated context brief, never a copy of the old transcript. Writing the brief sends this conversation’s text to the current model.',
      'error.title': 'Something went wrong',
      'error.retry': 'Try again',
      'detail.emptyTitle': 'Select a saved context brief',
      'detail.emptyBody': 'Choose one from the list, or create a new brief from a conversation.',
      'detail.source': 'Source',
      'detail.created': 'Created',
      'detail.updated': 'Updated',
      'detail.messages': '{count} messages',
      'detail.model': 'Model',
      'detail.cwd': 'Working directory',
      'detail.focus': 'Focus',
      'detail.review': 'This context brief was written by a model. Review it before starting.',
      'detail.continuation': 'The new conversation receives this brief as background only. It does not resume the old task; it waits for your next instruction.',
      'action.continue': 'Start a new conversation with this context',
      'action.continuing': 'Creating the clean conversation…',
      'action.copy': 'Copy context brief',
      'action.copied': 'Copied',
      'action.edit': 'Edit',
      'action.save': 'Save changes',
      'action.saving': 'Saving…',
      'action.cancel': 'Cancel',
      'action.delete': 'Delete',
      'action.confirmDelete': 'Delete permanently',
      'action.deleting': 'Deleting…',
      'action.deleteHint': 'This cannot be undone.',
      'action.openSource': 'Open source conversation',
      'action.refresh': 'Refresh',
      'edit.title': 'Title',
      'edit.summary': 'Context brief',
      'saved': 'Saved',
      'copied': 'Context brief copied to the clipboard.',
      'delete.done': 'Context brief deleted.',
      'launch.error': 'Could not start the new conversation: {message}',
      'close': 'Close',
      'untitled': 'Session context',
      'loading': 'Loading context briefs…',
      'loadError': 'Could not load context briefs: {message}',
    }

    const ZH = {
      'meta.title': '会话设定',
      'meta.description': '把对话的设定、规则、决策和当前状态整理成 AI 撰写的背景摘要，在新对话里带着这份设定继续聊。',
      'settings.label': '会话设定',
      'settings.title': '会话设定',
      'settings.description': '把老对话的设定、规则、偏好、关键决策和当前状态整理成可审阅的背景摘要；新对话只载入背景，不会自动继续旧任务。',
      'settings.storage': '设定摘要保存在专用数据文件夹，重启后仍然存在。',
      'header.tooltip': '载入会话设定',
      'dialog.title': '会话设定',
      'dialog.subtitle': '保留老对话的设定与背景，不把旧任务带过去。',
      'dialog.close': '关闭',
      'side.title': '已保存的设定摘要',
      'side.new': '新建设定摘要',
      'side.search': '搜索设定摘要',
      'side.empty': '还没有保存的设定摘要。',
      'side.emptyHint': '从任意对话创建第一份。',
      'side.noMatches': '没有匹配的设定摘要。',
      'side.count': '共 {count} 份',
      'source.label': '来源对话',
      'source.choose': '选择对话',
      'source.current': '当前对话',
      'source.blank': '这个对话还没有消息，先发一条消息。',
      'source.emptyOption': '空',
      'source.noSessions': '没有可用对话。请先打开一个对话。',
      'source.messages': '{count} 条消息',
      'focus.label': '重点关注（可选）',
      'focus.placeholder': '例如：保留项目背景、规则、API 决策和技术环境。',
      'generate': '生成设定摘要',
      'generating': '正在读取对话并撰写设定摘要…',
      'generating.button': '生成中…',
      'generating.hint': '长对话会分段总结，可能需要一分钟。',
      'generating.wait': '仍在处理，特别长的对话会更久。',
      'generating.cancel': '取消生成',
      'generating.closeHint': '关闭窗口会取消本次生成。',
      'privacy': '新对话只接收生成的设定摘要，不会复制旧对话正文。生成摘要时，这段对话的内容会发送给当前模型。',
      'error.title': '出了点问题',
      'error.retry': '重试',
      'detail.emptyTitle': '选择一份设定摘要',
      'detail.emptyBody': '从左侧选一份，或从某个对话新建一份。',
      'detail.source': '来源',
      'detail.created': '创建于',
      'detail.updated': '更新于',
      'detail.messages': '{count} 条消息',
      'detail.model': '模型',
      'detail.cwd': '工作目录',
      'detail.focus': '关注点',
      'detail.review': '这份设定摘要由模型撰写，开始前请先审阅。',
      'detail.continuation': '新对话只把这份摘要作为背景，不会自动继续旧任务，会等你下一条指令。',
      'action.continue': '用此设定开新对话',
      'action.continuing': '正在创建新对话…',
      'action.copy': '复制设定摘要',
      'action.copied': '已复制',
      'action.edit': '编辑',
      'action.save': '保存修改',
      'action.saving': '保存中…',
      'action.cancel': '取消',
      'action.delete': '删除',
      'action.confirmDelete': '确认永久删除',
      'action.deleting': '删除中…',
      'action.deleteHint': '删除后无法恢复。',
      'action.openSource': '打开来源对话',
      'action.refresh': '刷新',
      'edit.title': '标题',
      'edit.summary': '设定摘要',
      'saved': '已保存',
      'copied': '设定摘要已复制到剪贴板。',
      'delete.done': '设定摘要已删除。',
      'launch.error': '无法启动新对话：{message}',
      'close': '关闭',
      'untitled': '会话设定',
      'loading': '正在读取设定摘要…',
      'loadError': '读取设定摘要失败：{message}',
    }

    const CSS = `
      .dsh-handoff-sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
      .dsh-handoff-trigger { display:inline-flex; align-items:center; justify-content:center; gap:5px; height:28px; min-width:28px; padding:0 7px; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--dsw-alias-label-secondary); font:inherit; font-size:12px; cursor:pointer; transition:background .14s ease,color .14s ease,border-color .14s ease; }
      .dsh-handoff-trigger:hover { background:var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2)); color:var(--dsw-alias-label-primary); border-color:var(--dsw-alias-border-l1); }
      .dsh-handoff-trigger:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }
      .dsh-handoff-overlay { position:fixed; inset:0; z-index:1100; display:flex; align-items:center; justify-content:center; padding:24px; background:var(--dsw-alias-bg-mask-1, color-mix(in srgb, var(--dsw-alias-bg-base) 40%, transparent)); backdrop-filter:blur(10px); animation:dsh-handoff-fade .16s ease-out; }
      .dsh-handoff-dialog { width:min(1080px, calc(100vw - 48px)); max-height:min(840px, calc(100vh - 48px)); display:flex; flex-direction:column; overflow:hidden; border:1px solid var(--dsw-alias-border-l1); border-radius:18px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); box-shadow:0 28px 90px color-mix(in srgb, var(--dsw-alias-label-primary) 26%, transparent); outline:none; animation:dsh-handoff-rise .2s cubic-bezier(.2,.8,.2,1); }
      .dsh-handoff-dialog-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:20px 22px 16px; border-bottom:1px solid var(--dsw-alias-border-l1); }
      .dsh-handoff-dialog-title { display:flex; align-items:center; gap:10px; font-size:16px; font-weight:650; letter-spacing:-.01em; }
      .dsh-handoff-dialog-title > svg { color:var(--dsw-alias-brand-primary); }
      .dsh-handoff-dialog-sub { margin-top:5px; color:var(--dsw-alias-label-secondary); font-size:12.5px; line-height:1.5; }
      .dsh-handoff-icon-btn { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; flex:0 0 auto; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; }
      .dsh-handoff-icon-btn:hover { background:var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2)); color:var(--dsw-alias-label-primary); border-color:var(--dsw-alias-border-l1); }
      .dsh-handoff-icon-btn:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }
      .dsh-handoff-icon-btn[disabled] { opacity:.45; cursor:not-allowed; }
      .dsh-handoff-page { padding:0 0 28px; max-width:1120px; }
      .dsh-handoff-page-head { margin-bottom:16px; }
      .dsh-handoff-page-title { margin:0; font-size:18px; font-weight:650; letter-spacing:-.015em; }
      .dsh-handoff-page-desc { margin:6px 0 0; max-width:760px; color:var(--dsw-alias-label-secondary); font-size:13px; line-height:1.6; }
      .dsh-handoff-page .dsh-handoff-workspace { height:min(66vh, 720px); border:1px solid var(--dsw-alias-border-l1); border-radius:14px; overflow:hidden; background:var(--dsw-alias-bg-layer-1); }
      .dsh-handoff-page-foot { margin-top:10px; color:var(--dsw-alias-label-secondary); font-size:12px; }
      .dsh-handoff-workspace { display:grid; grid-template-columns:310px minmax(0,1fr); min-height:0; flex:1; }
      .dsh-handoff-side { display:flex; flex-direction:column; min-height:0; border-right:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); }
      .dsh-handoff-side-head { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:14px 14px 10px; }
      .dsh-handoff-side-title { font-size:12px; font-weight:650; letter-spacing:.02em; text-transform:uppercase; color:var(--dsw-alias-label-secondary); }
      .dsh-handoff-side-actions { display:flex; align-items:center; gap:4px; }
      .dsh-handoff-new { display:inline-flex; align-items:center; gap:5px; height:28px; padding:0 9px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font:inherit; font-size:12px; font-weight:600; cursor:pointer; }
      .dsh-handoff-new:hover { border-color:var(--dsw-alias-border-l2); background:var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-base)); }
      .dsh-handoff-new:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }
      .dsh-handoff-new[disabled] { opacity:.5; cursor:not-allowed; }
      .dsh-handoff-search { display:flex; align-items:center; gap:7px; margin:0 14px 10px; padding:0 9px; height:32px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-secondary); }
      .dsh-handoff-search input { min-width:0; flex:1; border:0; outline:none; background:transparent; color:var(--dsw-alias-label-primary); font:inherit; font-size:12.5px; }
      .dsh-handoff-search input::placeholder { color:var(--dsw-alias-label-secondary); }
      .dsh-handoff-list { flex:1; min-height:0; overflow:auto; padding:0 8px 12px; scrollbar-width:thin; }
      .dsh-handoff-list-item { width:100%; display:block; text-align:left; padding:10px 10px 11px; border:1px solid transparent; border-radius:9px; background:transparent; color:var(--dsw-alias-label-primary); font:inherit; cursor:pointer; }
      .dsh-handoff-list-item:hover { background:var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-1)); border-color:var(--dsw-alias-border-l1); }
      .dsh-handoff-list-item[data-active="true"] { background:var(--dsw-alias-interactive-bg-active, var(--dsw-alias-bg-layer-1)); border-color:var(--dsw-alias-border-l2); box-shadow:0 1px 2px color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent); }
      .dsh-handoff-list-item:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; }
      .dsh-handoff-list-item[disabled] { opacity:.55; cursor:not-allowed; }
      .dsh-handoff-list-title { display:block; font-size:12.8px; font-weight:600; line-height:1.4; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dsh-handoff-list-meta { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:4px; color:var(--dsw-alias-label-secondary); font-size:11px; line-height:1.4; }
      .dsh-handoff-list-source { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dsh-handoff-list-meta > span:last-child { flex:0 0 auto; white-space:nowrap; }
      .dsh-handoff-list-preview { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-top:5px; color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:1.45; }
      .dsh-handoff-side-empty { padding:24px 16px; color:var(--dsw-alias-label-secondary); font-size:12.5px; line-height:1.55; }
      .dsh-handoff-side-empty strong { display:block; margin-bottom:4px; color:var(--dsw-alias-label-primary); font-size:12.8px; }
      .dsh-handoff-main { min-width:0; min-height:0; overflow:auto; background:var(--dsw-alias-bg-layer-1); scrollbar-width:thin; }
      .dsh-handoff-panel { padding:22px 24px 26px; }
      .dsh-handoff-panel-narrow { max-width:760px; }
      .dsh-handoff-panel-title { margin:0; font-size:15px; font-weight:650; }
      .dsh-handoff-panel-desc { margin:5px 0 0; color:var(--dsw-alias-label-secondary); font-size:12.5px; line-height:1.55; }
      .dsh-handoff-field { margin-top:18px; }
      .dsh-handoff-label { display:block; margin-bottom:6px; color:var(--dsw-alias-label-secondary); font-size:11.5px; font-weight:650; letter-spacing:.02em; text-transform:uppercase; }
      .dsh-handoff-select, .dsh-handoff-input, .dsh-handoff-textarea { width:100%; box-sizing:border-box; border:1px solid var(--dsw-alias-border-l1); border-radius:9px; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font:inherit; font-size:13px; line-height:1.55; outline:none; }
      .dsh-handoff-select, .dsh-handoff-input { height:36px; padding:0 10px; }
      .dsh-handoff-textarea { min-height:88px; padding:10px 11px; resize:vertical; }
      .dsh-handoff-textarea:focus, .dsh-handoff-input:focus, .dsh-handoff-select:focus { border-color:var(--dsw-alias-brand-primary); box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent); }
      .dsh-handoff-textarea::placeholder, .dsh-handoff-input::placeholder { color:var(--dsw-alias-label-secondary); }
      .dsh-handoff-source-card { margin-top:8px; padding:11px 12px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-2); }
      .dsh-handoff-source-title { font-size:13px; font-weight:600; line-height:1.4; }
      .dsh-handoff-source-meta { margin-top:4px; color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:1.45; overflow-wrap:anywhere; }
      .dsh-handoff-source-warn { margin-top:7px; color:var(--dsw-alias-state-warn-primary); font-size:12px; line-height:1.5; }
      .dsh-handoff-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:18px; }
      .dsh-handoff-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:32px; padding:0 12px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font:inherit; font-size:12.5px; font-weight:550; cursor:pointer; transition:background .14s ease,border-color .14s ease,opacity .14s ease; }
      .dsh-handoff-btn:hover { border-color:var(--dsw-alias-border-l2); background:var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2)); }
      .dsh-handoff-btn:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }
      .dsh-handoff-btn[disabled] { opacity:.5; cursor:not-allowed; }
      .dsh-handoff-btn-primary { border-color:var(--dsw-alias-brand-primary); background:var(--dsw-alias-brand-primary); color:var(--dsw-alias-bg-base); }
      .dsh-handoff-btn-primary:hover { background:color-mix(in srgb, var(--dsw-alias-brand-primary) 86%, var(--dsw-alias-label-primary)); border-color:color-mix(in srgb, var(--dsw-alias-brand-primary) 86%, var(--dsw-alias-label-primary)); }
      .dsh-handoff-btn-danger { color:var(--dsw-alias-state-error-primary); border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, var(--dsw-alias-border-l1)); background:transparent; }
      .dsh-handoff-btn-danger:hover { background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); border-color:var(--dsw-alias-state-error-primary); }
      .dsh-handoff-btn-quiet { border-color:transparent; background:transparent; color:var(--dsw-alias-label-secondary); }
      .dsh-handoff-btn-quiet:hover { color:var(--dsw-alias-label-primary); background:var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2)); border-color:var(--dsw-alias-border-l1); }
      .dsh-handoff-note { margin-top:12px; padding:9px 11px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:1.55; }
      .dsh-handoff-note-privacy { display:flex; gap:7px; align-items:flex-start; }
      .dsh-handoff-note-privacy svg { flex:0 0 auto; margin-top:1px; }
      .dsh-handoff-error { margin-top:14px; padding:10px 12px; border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, var(--dsw-alias-border-l1)); border-radius:9px; background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent); color:var(--dsw-alias-state-error-primary); font-size:12px; line-height:1.5; overflow-wrap:anywhere; }
      .dsh-handoff-success { margin-top:14px; padding:10px 12px; border:1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, var(--dsw-alias-border-l1)); border-radius:9px; background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, transparent); color:var(--dsw-alias-state-success-primary); font-size:12px; line-height:1.5; }
      .dsh-handoff-progress { margin-top:18px; padding:16px; border:1px solid var(--dsw-alias-border-l1); border-radius:11px; background:var(--dsw-alias-bg-layer-2); }
      .dsh-handoff-progress-head { display:flex; align-items:center; gap:10px; font-size:13px; font-weight:550; }
      .dsh-handoff-spinner { width:16px; height:16px; flex:0 0 auto; border:2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 25%, transparent); border-top-color:var(--dsw-alias-brand-primary); border-radius:50%; animation:dsh-handoff-spin .8s linear infinite; }
      .dsh-handoff-progress-sub { margin-top:7px; color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:1.5; }
      .dsh-handoff-progress-track { position:relative; height:3px; overflow:hidden; margin-top:13px; border-radius:3px; background:var(--dsw-alias-border-l1); }
      .dsh-handoff-progress-track span { position:absolute; inset-block:0; width:38%; border-radius:3px; background:var(--dsw-alias-brand-primary); animation:dsh-handoff-slide 1.4s ease-in-out infinite; }
      .dsh-handoff-progress-actions { display:flex; justify-content:flex-end; margin-top:10px; }
      .dsh-handoff-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:320px; padding:32px; text-align:center; color:var(--dsw-alias-label-secondary); }
      .dsh-handoff-empty-icon { display:flex; align-items:center; justify-content:center; width:46px; height:46px; margin-bottom:12px; border:1px solid var(--dsw-alias-border-l1); border-radius:14px; background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-brand-primary); }
      .dsh-handoff-empty-title { color:var(--dsw-alias-label-primary); font-size:13.5px; font-weight:600; }
      .dsh-handoff-empty-body { max-width:330px; margin-top:6px; font-size:12px; line-height:1.55; }
      .dsh-handoff-detail-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding-bottom:14px; border-bottom:1px solid var(--dsw-alias-border-l1); }
      .dsh-handoff-detail-title { margin:0; font-size:17px; font-weight:650; letter-spacing:-.015em; line-height:1.35; overflow-wrap:anywhere; }
      .dsh-handoff-detail-meta { display:flex; flex-wrap:wrap; gap:4px 12px; margin-top:7px; color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:1.5; }
      .dsh-handoff-detail-meta span { overflow-wrap:anywhere; }
      .dsh-handoff-detail-body { padding:16px 0 4px; }
      .dsh-handoff-markdown { color:var(--dsw-alias-label-primary); font-size:13px; line-height:1.65; overflow-wrap:anywhere; }
      .dsh-handoff-markdown h3 { margin:20px 0 8px; font-size:13px; font-weight:700; letter-spacing:.01em; color:var(--dsw-alias-label-primary); }
      .dsh-handoff-markdown h3:first-child { margin-top:0; }
      .dsh-handoff-markdown h4 { margin:16px 0 7px; font-size:12.5px; font-weight:650; }
      .dsh-handoff-markdown p { margin:0 0 8px; }
      .dsh-handoff-markdown ul, .dsh-handoff-markdown ol { margin:0 0 10px; padding-left:20px; }
      .dsh-handoff-markdown li { margin:3px 0; padding-left:1px; }
      .dsh-handoff-markdown code { padding:1px 5px; border:1px solid var(--dsw-alias-border-l1); border-radius:5px; background:var(--dsw-alias-bg-layer-2); font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:11.5px; }
      .dsh-handoff-markdown strong { font-weight:650; }
      .dsh-handoff-markdown a { color:var(--dsw-alias-brand-primary); text-decoration:none; }
      .dsh-handoff-markdown a:hover { text-decoration:underline; }
      .dsh-handoff-detail-foot { margin-top:20px; padding-top:14px; border-top:1px solid var(--dsw-alias-border-l1); }
      .dsh-handoff-detail-foot-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
      .dsh-handoff-confirm { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:10px; padding:10px 11px; border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, var(--dsw-alias-border-l1)); border-radius:8px; background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 6%, transparent); color:var(--dsw-alias-label-secondary); font-size:12px; }
      .dsh-handoff-confirm-actions { display:flex; gap:7px; margin-left:auto; }
      .dsh-handoff-status { margin-top:10px; min-height:0; }
      .dsh-handoff-inline-status { margin-top:10px; color:var(--dsw-alias-label-secondary); font-size:11.5px; }
      .dsh-handoff-edit-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
      .dsh-handoff-count { color:var(--dsw-alias-label-secondary); font-size:11.5px; }
      .dsh-handoff-kbd { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:11px; }
      @keyframes dsh-handoff-spin { to { transform:rotate(360deg); } }
      @keyframes dsh-handoff-slide { 0% { left:-40%; } 100% { left:100%; } }
      @keyframes dsh-handoff-fade { from { opacity:0; } to { opacity:1; } }
      @keyframes dsh-handoff-rise { from { opacity:0; transform:translateY(10px) scale(.99); } to { opacity:1; transform:none; } }
      @media (max-width: 780px) {
        .dsh-handoff-overlay { padding:0; align-items:stretch; }
        .dsh-handoff-dialog { width:100vw; height:100dvh; max-height:none; border-radius:0; border:0; }
        .dsh-handoff-workspace { grid-template-columns:1fr; grid-template-rows:auto minmax(0,1fr); }
        .dsh-handoff-side { max-height:238px; border-right:0; border-bottom:1px solid var(--dsw-alias-border-l1); }
        .dsh-handoff-page .dsh-handoff-workspace { height:auto; grid-template-columns:1fr; grid-template-rows:auto minmax(0,1fr); }
        .dsh-handoff-page .dsh-handoff-side { max-height:260px; }
        .dsh-handoff-panel { padding:18px 16px 22px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .dsh-handoff-overlay, .dsh-handoff-dialog, .dsh-handoff-spinner, .dsh-handoff-progress-track span { animation:none; }
      }
    `

    function translate(ctx, key, vars) {
      const t = ctx.locale.bind(NS)
      try {
        return vars === undefined ? t(key) : t(key, vars)
      } catch {
        return key
      }
    }

    function useT(ctx) {
      const subscribe = useCallback(callback => ctx.locale.subscribe(callback), [ctx])
      const getSnapshot = useCallback(() => ctx.locale.getSnapshot().revision, [ctx])
      React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
      return (key, vars) => translate(ctx, key, vars)
    }

    function HandoffGlyph({ size = 16 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true,
      },
      h('path', { d: 'M2.5 4.25A1.25 1.25 0 0 1 3.75 3h3.5A1.25 1.25 0 0 1 8.5 4.25v7.5A1.25 1.25 0 0 1 7.25 13h-3.5A1.25 1.25 0 0 1 2.5 11.75v-7.5Z' }),
      h('path', { d: 'M11 5.1h2.1M11.9 4.2 12.8 5.1l-.9.9' }),
      h('path', { d: 'M11 10.9h2.1M11.9 10 12.8 10.9l-.9.9' }))
    }

    function PlusGlyph({ size = 14 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', 'aria-hidden': true },
        h('path', { d: 'M8 3.2v9.6M3.2 8h9.6' }))
    }

    function CloseGlyph({ size = 15 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', 'aria-hidden': true },
        h('path', { d: 'm4 4 8 8M12 4l-8 8' }))
    }

    function SearchGlyph({ size = 13 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', 'aria-hidden': true },
        h('circle', { cx: 7, cy: 7, r: 4.2 }), h('path', { d: 'm10.2 10.2 3 3' }))
    }

    function CopyGlyph({ size = 14 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('rect', { x: 5.2, y: 5.2, width: 7.3, height: 7.3, rx: 1.3 }), h('path', { d: 'M3.5 10.2V4.5A1 1 0 0 1 4.5 3.5h5.7' }))
    }

    function EditGlyph({ size = 14 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'm9.6 3.4 3 3M4 12l.5-2.8 6.8-6.8a1.4 1.4 0 0 1 2 2L6.5 11.2 4 12Z' }))
    }

    function TrashGlyph({ size = 14 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M3.2 4.5h9.6M6.2 4.5V3.4c0-.5.4-.9.9-.9h1.8c.5 0 .9.4.9.9v1.1M4.4 4.5l.5 8.1c0 .7.6 1.2 1.2 1.2h3.8c.7 0 1.2-.5 1.2-1.2l.5-8.1' }))
    }

    function RefreshGlyph({ size = 14 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M12.7 6.7A5 5 0 1 0 13 9.2' }), h('path', { d: 'M12.7 3.5v3.2h-3.2' }))
    }

    function ArrowGlyph({ size = 14 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M3 8h9.2M9.4 4.9 12.5 8l-3.1 3.1' }))
    }

    function ShieldGlyph({ size = 13 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M8 2.5 12.8 4v3.6c0 2.5-1.8 4.4-4.8 5.9-3-1.5-4.8-3.4-4.8-5.9V4L8 2.5Z' }), h('path', { d: 'm5.8 8 1.5 1.5 3-3' }))
    }

    function EmptyIcon() {
      return h('div', { className: 'dsh-handoff-empty-icon' }, h(HandoffGlyph, { size: 24 }))
    }

    function formatDate(timestamp, locale) {
      if (!Number.isSafeInteger(timestamp) || timestamp <= 0) return ''
      try {
        return new Date(timestamp).toLocaleString(locale === 'zh' ? 'zh-CN' : undefined, {
          dateStyle: 'medium', timeStyle: 'short',
        })
      } catch {
        return new Date(timestamp).toLocaleString()
      }
    }

    function inlineNodes(text, keyPrefix) {
      const nodes = []
      const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g
      let last = 0
      let index = 0
      for (const match of text.matchAll(pattern)) {
        const start = match.index ?? 0
        if (start > last) nodes.push(text.slice(last, start))
        const token = match[0]
        if (token.startsWith('**')) nodes.push(h('strong', { key: `${keyPrefix}-b-${index}` }, token.slice(2, -2)))
        else nodes.push(h('code', { key: `${keyPrefix}-c-${index}` }, token.slice(1, -1)))
        last = start + token.length
        index += 1
      }
      if (last < text.length) nodes.push(text.slice(last))
      return nodes
    }

    function MarkdownView({ text }) {
      const lines = String(text).split(/\r?\n/u)
      const blocks = []
      let bullets = []
      let ordered = []
      const flushBullets = () => {
        if (bullets.length > 0) {
          blocks.push(h('ul', { key: `ul-${blocks.length}` }, bullets.map((item, index) => h('li', { key: `li-${index}` }, inlineNodes(item, `ul-${blocks.length}-${index}`)))))
          bullets = []
        }
      }
      const flushOrdered = () => {
        if (ordered.length > 0) {
          blocks.push(h('ol', { key: `ol-${blocks.length}` }, ordered.map((item, index) => h('li', { key: `li-${index}` }, inlineNodes(item, `ol-${blocks.length}-${index}`)))))
          ordered = []
        }
      }
      const flush = () => { flushBullets(); flushOrdered() }
      for (const raw of lines) {
        const line = raw.trimEnd()
        if (line.trim() === '') { flush(); continue }
        const heading = /^(#{2,4})\s+(.*)$/u.exec(line)
        if (heading !== null) {
          flush()
          blocks.push(h(heading[1].length === 2 ? 'h3' : 'h4', { key: `h-${blocks.length}` }, inlineNodes(heading[2], `h-${blocks.length}`)))
          continue
        }
        const bullet = /^\s*[-*]\s+(.*)$/u.exec(line)
        if (bullet !== null) { flushOrdered(); bullets.push(bullet[1]); continue }
        const numbered = /^\s*\d+[.)]\s+(.*)$/u.exec(line)
        if (numbered !== null) { flushBullets(); ordered.push(numbered[1]); continue }
        flush()
        blocks.push(h('p', { key: `p-${blocks.length}` }, inlineNodes(line, `p-${blocks.length}`)))
      }
      flush()
      if (blocks.length === 0) return h('p', { className: 'dsh-handoff-inline-status' }, '—')
      return h('div', { className: 'dsh-handoff-markdown' }, blocks)
    }

    function useElapsed(active) {
      const [seconds, setSeconds] = useState(0)
      useEffect(() => {
        if (!active) { setSeconds(0); return undefined }
        setSeconds(0)
        const id = window.setInterval(() => setSeconds(value => value + 1), 1000)
        return () => window.clearInterval(id)
      }, [active])
      return seconds
    }

    function newRequestId() {
      try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
      } catch {
        // Fall back to a time-based identity below.
      }
      return `handoff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    }

    function continuationMessage(brief) {
      const source = typeof brief.sourceTitle === 'string' && brief.sourceTitle.trim() !== ''
        ? ` from the conversation "${brief.sourceTitle}"`
        : ''
      const cwd = typeof brief.sourceCwd === 'string' && brief.sourceCwd !== ''
        ? `Working directory: ${brief.sourceCwd}`
        : ''
      return [
        `You are starting a new conversation with background${source}. The original conversation is intentionally not attached; do not try to reconstruct or quote it.`,
        'An AI-written context brief follows. Treat it as established background, not as a transcript or a task list.',
        ...(cwd === '' ? [] : [cwd]),
        '',
        '<context-brief>',
        brief.summary,
        '</context-brief>',
        '',
        'Do not resume, continue, or act on any previous task. Do not propose next steps or start working. The user will send a new instruction separately. For now, reply in one short sentence confirming that you have the context and are ready, then wait.',
      ].join('\n')
    }

    async function copyText(value) {
      if (navigator.clipboard?.writeText !== undefined) {
        await navigator.clipboard.writeText(value)
        return
      }
      const area = document.createElement('textarea')
      area.value = value
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const copied = document.execCommand('copy')
      area.remove()
      if (!copied) throw new Error('clipboard is unavailable')
    }

    function apiUrl(path) {
      return new URL(`api/handoff/${path}`, document.baseURI)
    }

    async function api(path, payload = {}, signal) {
      const response = await fetch(apiUrl(path), {
        method: path === 'status' ? 'GET' : 'POST',
        credentials: 'same-origin',
        headers: path === 'status' ? { accept: 'application/json' } : { 'content-type': 'application/json', accept: 'application/json' },
        ...(path === 'status' ? {} : { body: JSON.stringify(payload) }),
        ...(signal === undefined ? {} : { signal }),
      })
      let data
      try {
        data = await response.json()
      } catch {
        data = undefined
      }
      if (!response.ok || data?.ok === false) {
        const message = typeof data?.error?.message === 'string' && data.error.message !== ''
          ? data.error.message
          : `Request failed (${response.status})`
        throw new Error(message)
      }
      return data ?? {}
    }

    function DialogHeader({ t, onClose, disabled }) {
      return h('div', { className: 'dsh-handoff-dialog-head' },
        h('div', null,
          h('div', { className: 'dsh-handoff-dialog-title' }, h(HandoffGlyph, { size: 18 }), t('dialog.title')),
          h('div', { className: 'dsh-handoff-dialog-sub' }, t('dialog.subtitle'))),
        h('button', {
          type: 'button', className: 'dsh-handoff-icon-btn', onClick: onClose, disabled,
          'aria-label': t('dialog.close'), title: t('dialog.close'),
        }, h(CloseGlyph)))
    }

    function HeaderAction(props) {
      const { ctx, sessionId, useSessions, useWorkspaces } = props
      const t = useT(ctx)
      const [open, setOpen] = useState(false)
      const triggerRef = useRef(null)
      const row = useSessions(state => state.byId[sessionId])
      const title = row?.displayTitle === undefined ? t('header.tooltip') : `${t('header.tooltip')} · ${row.displayTitle}`
      if (row?.origin === 'subagent') return null
      const close = () => {
        setOpen(false)
        window.setTimeout(() => triggerRef.current?.focus(), 0)
      }
      return h(React.Fragment, null,
        h('button', {
          type: 'button', className: 'dsh-handoff-trigger', 'aria-label': t('header.tooltip'),
          title, 'aria-haspopup': 'dialog', onClick: () => setOpen(true), ref: triggerRef,
        }, h(HandoffGlyph, { size: 15 }), h('span', { className: 'dsh-handoff-sr' }, t('header.tooltip'))),
        open ? h(HandoffDialog, {
          ctx, sessionId, useSessions, useWorkspaces, initialView: 'create', onClose: close,
        }) : null)
    }

    function SettingsIcon({ size }) {
      return h(HandoffGlyph, { size: Number.isFinite(size) ? size : 16 })
    }

    function SettingsPage(props) {
      const { ctx, close, useSessions, useWorkspaces } = props
      const t = useT(ctx)
      return h('div', { className: 'dsh-handoff-page' },
        h('div', { className: 'dsh-handoff-page-head' },
          h('h2', { className: 'dsh-handoff-page-title' }, t('settings.title')),
          h('p', { className: 'dsh-handoff-page-desc' }, t('settings.description'))),
        h(HandoffWorkspace, {
          ctx, variant: 'page', initialView: 'detail', useSessions, useWorkspaces,
          onClose: typeof close === 'function' ? close : undefined,
        }),
        h('div', { className: 'dsh-handoff-page-foot' }, t('settings.storage')))
    }

    function HandoffDialog({ ctx, sessionId, useSessions, useWorkspaces, initialView, onClose }) {
      const t = useT(ctx)
      const dialogRef = useRef(null)
      const closeRef = useRef(onClose)
      closeRef.current = onClose
      const trapTab = event => {
        if (event.key !== 'Tab' || dialogRef.current === null) return
        const focusable = Array.from(dialogRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        )).filter(element => element.offsetParent !== null)
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
      useEffect(() => {
        const previous = document.body.style.overflow
        const appRoot = document.getElementById('root')
        const previousInert = appRoot?.inert
        document.body.style.overflow = 'hidden'
        if (appRoot) appRoot.inert = true
        const focus = window.setTimeout(() => { dialogRef.current?.focus() }, 0)
        const onKey = event => {
          if (event.key === 'Escape') {
            event.preventDefault()
            closeRef.current()
          }
        }
        document.addEventListener('keydown', onKey, true)
        return () => {
          document.body.style.overflow = previous
          if (appRoot) appRoot.inert = previousInert ?? false
          window.clearTimeout(focus)
          document.removeEventListener('keydown', onKey, true)
        }
      }, [])
      const content = h('div', {
        className: 'dsh-handoff-overlay', role: 'presentation',
        onClick: event => { if (event.target === event.currentTarget) onClose() },
      },
      h('div', {
        className: 'dsh-handoff-dialog', role: 'dialog', 'aria-modal': 'true',
        'aria-label': t('dialog.title'), tabIndex: -1, ref: dialogRef,
        onClick: event => event.stopPropagation(), onKeyDown: trapTab,
      },
      h(DialogHeader, { t, onClose }),
      h(HandoffWorkspace, {
        ctx, variant: 'dialog', initialView,
        fixedSessionId: sessionId, useSessions, useWorkspaces, onClose,
      })))
      return typeof ReactDOM.createPortal === 'function'
        ? ReactDOM.createPortal(content, document.body)
        : content
    }

    function HandoffWorkspace({ ctx, variant, initialView, fixedSessionId, useSessions, useWorkspaces, onClose }) {
      const t = useT(ctx)
      const locale = ctx.locale.getLocale().active
      const sessionState = useSessions(state => state) ?? { ids: [], byId: {} }
      const workspaceState = useWorkspaces(state => state) ?? { items: [] }
      const archived = useMemo(() => new Set(Array.isArray(workspaceState.archivedSessionIds) ? workspaceState.archivedSessionIds : []), [workspaceState.archivedSessionIds])
      const rows = useMemo(() => (sessionState.ids ?? [])
        .map(id => sessionState.byId?.[id])
        .filter(row => row !== undefined && row.origin !== 'subagent' && !archived.has(row.id))
        .sort((left, right) => Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0)), [sessionState, archived])
      const currentId = useMemo(() => rows.find(row => (row.retainedBy?.mainView ?? 0) > 0)?.id, [rows])
      const [sourceId, setSourceId] = useState(fixedSessionId ?? currentId ?? rows[0]?.id)
      useEffect(() => {
        if (fixedSessionId !== undefined) {
          if (sourceId !== fixedSessionId) setSourceId(fixedSessionId)
          return
        }
        if (sourceId === undefined || !rows.some(row => row.id === sourceId)) {
          setSourceId(currentId ?? rows[0]?.id)
        }
      }, [fixedSessionId, currentId, rows, sourceId])
      const source = sourceId === undefined ? undefined : sessionState.byId?.[sourceId]
      const [items, setItems] = useState([])
      const [listLoading, setListLoading] = useState(true)
      const [listError, setListError] = useState('')
      const [selectedId, setSelectedId] = useState(undefined)
      const [view, setView] = useState(initialView === 'create' ? 'create' : 'detail')
      const [query, setQuery] = useState('')
      const [focus, setFocus] = useState('')
      const [creating, setCreating] = useState(false)
      const [createError, setCreateError] = useState('')
      const generationRef = useRef(null)
      const cancelRequestedRef = useRef(false)
      const [editId, setEditId] = useState(undefined)
      const [editTitle, setEditTitle] = useState('')
      const [editSummary, setEditSummary] = useState('')
      const [saving, setSaving] = useState(false)
      const [savedNotice, setSavedNotice] = useState('')
      const [launching, setLaunching] = useState(false)
      const [launchError, setLaunchError] = useState('')
      const [launchNotice, setLaunchNotice] = useState('')
      const [copied, setCopied] = useState(false)
      const [copyError, setCopyError] = useState('')
      const [pendingDelete, setPendingDelete] = useState(false)
      const [deleting, setDeleting] = useState(false)
      const elapsed = useElapsed(creating)
      const selected = items.find(item => item.id === selectedId)
      useEffect(() => () => { generationRef.current?.abort() }, [])
      useEffect(() => {
        setEditId(undefined)
        setEditTitle('')
        setEditSummary('')
        setPendingDelete(false)
        setLaunchError('')
        setCopyError('')
      }, [selected?.id])
      const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (needle === '') return items
        return items.filter(item => `${item.title}\n${item.sourceTitle}\n${item.summary}`.toLowerCase().includes(needle))
      }, [items, query])
      const workspaceIdFor = useCallback((id) => {
        const list = Array.isArray(workspaceState.items) ? workspaceState.items : []
        return list.find(workspace => Array.isArray(workspace.sessionIds) && workspace.sessionIds.includes(id))?.workspaceId
      }, [workspaceState.items])

      const load = useCallback(async (selectFirst) => {
        setListLoading(true)
        setListError('')
        try {
          const data = await api('list')
          const next = Array.isArray(data.items) ? data.items : []
          setItems(next)
          setSelectedId(previous => previous !== undefined && next.some(item => item.id === previous)
            ? previous
            : (selectFirst ? next[0]?.id : undefined))
        } catch (error) {
          setListError(error instanceof Error ? error.message : String(error))
        } finally {
          setListLoading(false)
        }
      }, [])

      useEffect(() => { void load(initialView === 'detail') }, [load, initialView])

      useEffect(() => {
        if (view === 'detail' && selected === undefined && items.length > 0 && selectedId === undefined) {
          setSelectedId(items[0].id)
        }
      }, [items, selected, selectedId, view])

      const startCreate = () => {
        setView('create')
        setCreateError('')
        setLaunchError('')
        setLaunchNotice('')
        setSavedNotice('')
      }

      const chooseItem = (id) => {
        setSelectedId(id)
        setView('detail')
        setEditId(undefined)
        setPendingDelete(false)
        setLaunchError('')
        setLaunchNotice('')
        setSavedNotice('')
        setCopyError('')
      }

      const createBrief = async () => {
        if (sourceId === undefined || creating) return
        if (source?.blank === true) {
          setCreateError(t('source.blank'))
          return
        }
        const controller = new AbortController()
        generationRef.current = controller
        cancelRequestedRef.current = false
        setCreating(true)
        setCreateError('')
        try {
          const data = await api('create', {
            sessionId: sourceId,
            focus: focus.trim(),
            sourceTitle: source?.displayTitle,
            workspaceId: workspaceState.items === undefined ? undefined : workspaceIdFor(sourceId),
          }, controller.signal)
          const brief = data.brief
          if (brief === undefined) throw new Error('the server returned no brief')
          setItems(previous => [brief, ...previous.filter(item => item.id !== brief.id)])
          setSelectedId(brief.id)
          setView('detail')
          setFocus('')
          setSavedNotice(t('saved'))
          setEditId(undefined)
        } catch (error) {
          if (!cancelRequestedRef.current && !controller.signal.aborted) {
            setCreateError(error instanceof Error ? error.message : String(error))
          }
        } finally {
          if (generationRef.current === controller) generationRef.current = null
          cancelRequestedRef.current = false
          setCreating(false)
        }
      }

      const cancelGeneration = () => {
        cancelRequestedRef.current = true
        generationRef.current?.abort()
      }

      const beginEdit = () => {
        if (selected === undefined) return
        setEditTitle(selected.title)
        setEditSummary(selected.summary)
        setEditId(selected.id)
        setSavedNotice('')
        setPendingDelete(false)
        setLaunchError('')
      }

      const saveEdit = async () => {
        if (selected === undefined || saving || editId !== selected.id) return
        if (editTitle.trim() === '' || editSummary.trim() === '') return
        setSaving(true)
        setSavedNotice('')
        try {
          const data = await api('update', { id: selected.id, title: editTitle.trim(), summary: editSummary.trim() })
          const brief = data.brief
          if (brief !== undefined) {
            setItems(previous => previous.map(item => item.id === brief.id ? brief : item))
          }
          setEditId(undefined)
          setSavedNotice(t('saved'))
        } catch (error) {
          setLaunchError(error instanceof Error ? error.message : String(error))
        } finally {
          setSaving(false)
        }
      }

      const deleteBrief = async () => {
        if (selected === undefined || deleting) return
        setDeleting(true)
        setLaunchError('')
        try {
          await api('delete', { id: selected.id })
          const remaining = items.filter(item => item.id !== selected.id)
          setItems(remaining)
          setEditId(undefined)
          setEditTitle('')
          setEditSummary('')
          setPendingDelete(false)
          setSavedNotice('')
          setLaunchNotice(t('delete.done'))
          if (remaining.length > 0) {
            setSelectedId(remaining[0].id)
            setView('detail')
          } else {
            setSelectedId(undefined)
            setView('create')
          }
        } catch (error) {
          setLaunchError(error instanceof Error ? error.message : String(error))
        } finally {
          setDeleting(false)
        }
      }

      const launch = async () => {
        if (selected === undefined || launching) return
        setLaunching(true)
        setLaunchError('')
        setLaunchNotice('')
        try {
          const preferredWorkspace = workspaceIdFor(selected.sourceSessionId)
            ?? (typeof selected.sourceWorkspaceId === 'string' && selected.sourceWorkspaceId !== ''
              ? selected.sourceWorkspaceId
              : undefined)
          const bases = []
          if (preferredWorkspace !== undefined) bases.push({ workspaceId: preferredWorkspace })
          if (typeof selected.sourceCwd === 'string' && selected.sourceCwd !== '') bases.push({ cwd: selected.sourceCwd })
          if (bases.length === 0) bases.push({})
          const preset = typeof selected.sourceAgentPreset === 'string' && selected.sourceAgentPreset !== ''
            ? selected.sourceAgentPreset
            : undefined
          let newSessionId
          let sessionCreateError
          for (const base of bases) {
            for (const usePreset of preset === undefined ? [false] : [true, false]) {
              try {
                newSessionId = await ctx.sessions.create({
                  ...base,
                  ...(usePreset ? { agentPreset: preset } : {}),
                })
                break
              } catch (error) {
                sessionCreateError = error
              }
            }
            if (newSessionId !== undefined) break
          }
          if (newSessionId === undefined) {
            throw sessionCreateError instanceof Error ? sessionCreateError : new Error('could not create a continuation session')
          }
          if (selected.sourceModel?.provider && selected.sourceModel?.model) {
            try {
              await ctx.remote.session.selectModel({
                sessionId: newSessionId,
                provider: selected.sourceModel.provider,
                model: selected.sourceModel.model,
                ...(selected.sourceModel.reasoningEffort === undefined ? {} : { reasoningEffort: selected.sourceModel.reasoningEffort }),
              })
            } catch {
              // A default model is still a usable continuation; selection is best-effort.
            }
          }
          const result = await ctx.remote.session.prompt({
            requestId: newRequestId(),
            sessionId: newSessionId,
            mode: 'queue',
            content: [{ type: 'text', text: continuationMessage(selected) }],
            clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
          if (result?.ok !== true) {
            try { await ctx.uiWorkspace.archiveSession(newSessionId, { stopActivity: false }) } catch {}
            throw new Error(result?.error?.message ?? 'the prompt was refused')
          }
          ctx.uiWorkspace.openSession(newSessionId)
          if (typeof onClose === 'function') onClose()
        } catch (error) {
          setLaunchError(t('launch.error', { message: error instanceof Error ? error.message : String(error) }))
        } finally {
          setLaunching(false)
        }
      }

      const copyBrief = async () => {
        if (selected === undefined) return
        setCopyError('')
        try {
          await copyText(selected.summary)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        } catch (error) {
          setCopyError(error instanceof Error ? error.message : String(error))
        }
      }

      const openSource = () => {
        if (selected === undefined) return
        try {
          ctx.uiWorkspace.openSession(selected.sourceSessionId)
          if (typeof onClose === 'function') onClose()
        } catch (error) {
          setLaunchError(error instanceof Error ? error.message : String(error))
        }
      }

      const sourceMeta = source === undefined
        ? ''
        : (typeof source.cwd === 'string' && source.cwd !== '' ? source.cwd : source.id)

      const side = h('aside', { className: 'dsh-handoff-side' },
        h('div', { className: 'dsh-handoff-side-head' },
          h('div', { className: 'dsh-handoff-side-title' },
            items.length > 0 ? `${t('side.title')} · ${t('side.count', { count: items.length })}` : t('side.title')),
          h('div', { className: 'dsh-handoff-side-actions' },
            h('button', {
              type: 'button', className: 'dsh-handoff-new', onClick: startCreate, disabled: creating || launching,
            }, h(PlusGlyph), t('side.new')),
            h('button', {
              type: 'button', className: 'dsh-handoff-icon-btn', title: t('action.refresh'), 'aria-label': t('action.refresh'),
              onClick: () => { void load(false) }, disabled: listLoading || creating || launching,
            }, h(RefreshGlyph)))),
        h('div', { className: 'dsh-handoff-search' }, h(SearchGlyph), h('input', {
          type: 'search', value: query, placeholder: t('side.search'), 'aria-label': t('side.search'),
          onChange: event => setQuery(event.target.value),
        })),
        h('div', { className: 'dsh-handoff-list' },
          listLoading ? h('div', { className: 'dsh-handoff-side-empty' }, t('loading')) : null,
          listError !== '' ? h('div', { className: 'dsh-handoff-side-empty' }, t('loadError', { message: listError })) : null,
          !listLoading && listError === '' && filtered.length === 0
            ? h('div', { className: 'dsh-handoff-side-empty' },
              h('strong', null, query.trim() === '' ? t('side.empty') : t('side.noMatches')),
              h('span', null, query.trim() === '' ? t('side.emptyHint') : ''))
            : null,
          filtered.map(item => h('button', {
            key: item.id, type: 'button', className: 'dsh-handoff-list-item',
            'data-active': item.id === selectedId ? 'true' : 'false',
            'aria-current': item.id === selectedId ? 'true' : undefined,
            onClick: () => chooseItem(item.id), disabled: creating || launching,
          },
          h('span', { className: 'dsh-handoff-list-title' }, item.title),
          h('span', { className: 'dsh-handoff-list-meta' },
            h('span', { className: 'dsh-handoff-list-source' }, item.sourceTitle || item.sourceSessionId.slice(0, 12)),
            h('span', null, formatDate(item.updatedAt, locale))),
          h('span', { className: 'dsh-handoff-list-preview' }, item.summary.replace(/^#{1,4}\s+/gmu, '').slice(0, 220))))))

      const createPanel = h('div', { className: 'dsh-handoff-panel dsh-handoff-panel-narrow' },
        h('h3', { className: 'dsh-handoff-panel-title' }, t('side.new')),
        h('p', { className: 'dsh-handoff-panel-desc' }, t('settings.description')),
        variant === 'page'
          ? h('div', { className: 'dsh-handoff-field' },
            h('label', { className: 'dsh-handoff-label', htmlFor: 'dsh-handoff-source-select' }, t('source.choose')),
            rows.length === 0
              ? h('div', { className: 'dsh-handoff-note' }, t('source.noSessions'))
              : h('select', {
                id: 'dsh-handoff-source-select', className: 'dsh-handoff-select', value: sourceId ?? '',
                onChange: event => setSourceId(event.target.value || undefined), disabled: creating,
              }, rows.slice(0, 60).map(row => h('option', { key: row.id, value: row.id }, `${row.displayTitle}${row.blank ? ' — ' + t('source.emptyOption') : ''}`))))
          : h('div', { className: 'dsh-handoff-field' },
            h('div', { className: 'dsh-handoff-label' }, t('source.current'))),
        h('div', { className: 'dsh-handoff-source-card' },
          h('div', { className: 'dsh-handoff-source-title' }, source?.displayTitle ?? t('source.noSessions')),
          h('div', { className: 'dsh-handoff-source-meta' }, sourceMeta || t('source.noSessions')),
          source?.blank === true ? h('div', { className: 'dsh-handoff-source-warn' }, t('source.blank')) : null),
        h('div', { className: 'dsh-handoff-field' },
          h('label', { className: 'dsh-handoff-label', htmlFor: 'dsh-handoff-focus' }, t('focus.label')),
          h('textarea', {
            id: 'dsh-handoff-focus', className: 'dsh-handoff-textarea', value: focus, rows: 3,
            placeholder: t('focus.placeholder'), onChange: event => setFocus(event.target.value), disabled: creating,
          })),
        h('div', { className: 'dsh-handoff-note dsh-handoff-note-privacy' }, h(ShieldGlyph), h('span', null, t('privacy'))),
        creating
          ? h('div', { className: 'dsh-handoff-progress', role: 'status', 'aria-live': 'polite' },
            h('div', { className: 'dsh-handoff-progress-head' }, h('span', { className: 'dsh-handoff-spinner' }), t('generating')),
            h('div', { className: 'dsh-handoff-progress-sub' }, t('generating.hint')),
            elapsed >= 15 ? h('div', { className: 'dsh-handoff-progress-sub' }, t('generating.wait')) : null,
            h('div', { className: 'dsh-handoff-progress-track' }, h('span', null)),
            h('div', { className: 'dsh-handoff-progress-sub' }, t('generating.closeHint')),
            h('div', { className: 'dsh-handoff-progress-actions' },
              h('button', {
                type: 'button', className: 'dsh-handoff-btn dsh-handoff-btn-quiet', onClick: cancelGeneration,
              }, t('generating.cancel'))))
          : null,
        createError !== '' ? h('div', { className: 'dsh-handoff-error', role: 'alert' }, createError) : null,
        h('div', { className: 'dsh-handoff-actions' },
          h('button', {
            type: 'button', className: 'dsh-handoff-btn dsh-handoff-btn-primary', onClick: () => { void createBrief() },
            disabled: creating || sourceId === undefined || source?.blank === true,
          }, h(HandoffGlyph), creating ? t('generating.button') : t('generate'))))

      let detailPanel
      if (selected === undefined) {
        detailPanel = h('div', { className: 'dsh-handoff-empty' },
          h(EmptyIcon),
          h('div', { className: 'dsh-handoff-empty-title' }, t('detail.emptyTitle')),
          h('div', { className: 'dsh-handoff-empty-body' }, t('detail.emptyBody')),
          h('div', { className: 'dsh-handoff-actions' },
            h('button', { type: 'button', className: 'dsh-handoff-btn dsh-handoff-btn-primary', onClick: startCreate },
              h(PlusGlyph), t('side.new'))))
      } else {
        const meta = [
          h('span', { key: 'source' }, `${t('detail.source')}: ${selected.sourceTitle || selected.sourceSessionId.slice(0, 12)}`),
          h('span', { key: 'created' }, `${t('detail.created')}: ${formatDate(selected.createdAt, locale)}`),
          Number.isSafeInteger(selected.messageCount)
            ? h('span', { key: 'messages' }, t('detail.messages', { count: selected.messageCount }))
            : null,
          selected.sourceModel?.model
            ? h('span', { key: 'model' }, `${t('detail.model')}: ${selected.sourceModel.model}`)
            : null,
          selected.sourceCwd
            ? h('span', { key: 'cwd' }, `${t('detail.cwd')}: ${selected.sourceCwd}`)
            : null,
        ].filter(Boolean)
        const head = h('div', { className: 'dsh-handoff-detail-head' },
          h('div', null,
            h('h3', { className: 'dsh-handoff-detail-title' }, selected.title),
            h('div', { className: 'dsh-handoff-detail-meta' }, meta),
            selected.focus
              ? h('div', { className: 'dsh-handoff-detail-meta' },
                h('span', null, `${t('detail.focus')}: ${selected.focus}`))
              : null),
          h('div', { className: 'dsh-handoff-actions', style: { marginTop: 0 } },
            h('button', {
              type: 'button', className: 'dsh-handoff-btn dsh-handoff-btn-quiet', onClick: beginEdit,
              disabled: launching || saving,
            }, h(EditGlyph), t('action.edit')),
            h('button', {
              type: 'button', className: 'dsh-handoff-btn dsh-handoff-btn-quiet', onClick: () => { void copyBrief() },
              disabled: launching,
            }, h(CopyGlyph), copied ? t('action.copied') : t('action.copy'))))
        const body = editId === selected.id
          ? h('div', { className: 'dsh-handoff-detail-body' },
            h('div', { className: 'dsh-handoff-field' },
              h('label', { className: 'dsh-handoff-label', htmlFor: 'dsh-handoff-edit-title' }, t('edit.title')),
              h('input', {
                id: 'dsh-handoff-edit-title', className: 'dsh-handoff-input', value: editTitle,
                onChange: event => setEditTitle(event.target.value),
              })),
            h('div', { className: 'dsh-handoff-field' },
              h('label', { className: 'dsh-handoff-label', htmlFor: 'dsh-handoff-edit-summary' }, t('edit.summary')),
              h('textarea', {
                id: 'dsh-handoff-edit-summary', className: 'dsh-handoff-textarea', rows: 18, value: editSummary,
                onChange: event => setEditSummary(event.target.value),
              })),
            h('div', { className: 'dsh-handoff-edit-actions' },
              h('button', {
                type: 'button', className: 'dsh-handoff-btn', onClick: () => setEditId(undefined), disabled: saving,
              }, t('action.cancel')),
              h('button', {
                type: 'button', className: 'dsh-handoff-btn dsh-handoff-btn-primary',
                onClick: () => { void saveEdit() },
                disabled: saving || editTitle.trim() === '' || editSummary.trim() === '',
              }, saving ? t('action.saving') : t('action.save'))))
          : h('div', { className: 'dsh-handoff-detail-body' }, h(MarkdownView, { text: selected.summary }))
        const footerActions = h('div', { className: 'dsh-handoff-detail-foot-actions' },
          h('button', {
            type: 'button', className: 'dsh-handoff-btn dsh-handoff-btn-primary',
            onClick: () => { void launch() },
            disabled: launching || editId === selected.id || saving,
          }, h(ArrowGlyph), launching ? t('action.continuing') : t('action.continue')),
          h('button', {
            type: 'button', className: 'dsh-handoff-btn', onClick: openSource, disabled: launching,
          }, t('action.openSource')),
          h('button', {
            type: 'button', className: 'dsh-handoff-btn dsh-handoff-btn-danger',
            onClick: () => setPendingDelete(value => !value), disabled: launching || deleting,
          }, h(TrashGlyph), t('action.delete')))
        const confirm = pendingDelete
          ? h('div', { className: 'dsh-handoff-confirm' },
            h('span', null, t('action.deleteHint')),
            h('div', { className: 'dsh-handoff-confirm-actions' },
              h('button', {
                type: 'button', className: 'dsh-handoff-btn', onClick: () => setPendingDelete(false), disabled: deleting,
              }, t('action.cancel')),
              h('button', {
                type: 'button', className: 'dsh-handoff-btn dsh-handoff-btn-danger',
                onClick: () => { void deleteBrief() }, disabled: deleting,
              }, deleting ? t('action.deleting') : t('action.confirmDelete'))))
          : null
        const feedback = [
          launchError !== '' ? h('div', { key: 'launch-error', className: 'dsh-handoff-error', role: 'alert' }, launchError) : null,
          launchNotice !== '' ? h('div', { key: 'launch-notice', className: 'dsh-handoff-success', role: 'status' }, launchNotice) : null,
          savedNotice !== '' ? h('div', { key: 'saved', className: 'dsh-handoff-success', role: 'status' }, savedNotice) : null,
          copyError !== '' ? h('div', { key: 'copy-error', className: 'dsh-handoff-error', role: 'alert' }, copyError) : null,
        ].filter(Boolean)
        detailPanel = h('div', { className: 'dsh-handoff-panel' },
          head,
          body,
          h('div', { className: 'dsh-handoff-inline-status' }, t('detail.review')),
          h('div', { className: 'dsh-handoff-detail-foot' },
            h('div', { className: 'dsh-handoff-inline-status' }, t('detail.continuation')),
            footerActions,
            confirm,
            feedback))
      }

      return h('div', { className: `dsh-handoff-workspace dsh-handoff-workspace-${variant}` }, side, h('main', { className: 'dsh-handoff-main' }, view === 'create' ? createPanel : detailPanel))
    }

    return {
      inject: ['slots', 'locale', 'sessions', 'remote', 'remote.session', 'uiWorkspace'],
      apply(ctx) {
        const t = key => translate(ctx, key)
        ctx.effect(() => ctx.locale.register(NS, { en: EN, zh: ZH }), 'context-handoff: dictionaries')
        ctx.effect(() => {
          const style = document.createElement('style')
          style.dataset.dshPlugin = '@local/dsh-context-handoff'
          style.textContent = CSS
          document.head.appendChild(style)
          return () => style.remove()
        }, 'context-handoff: styles')

        const HeaderActionWithCtx = props => h(HeaderAction, { ...props, ctx })
        const SettingsPageWithCtx = props => h(SettingsPage, { ...props, ctx })

        ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
          name: 'conversation.session.header.actions',
          id: 'context-handoff',
          order: 25,
          label: () => t('meta.title'),
        }, HeaderActionWithCtx))

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'context-handoff',
          order: 35,
          label: () => t('settings.label'),
        }, SettingsPageWithCtx))

        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon',
          id: 'context-handoff',
          order: 35,
        }, SettingsIcon))

        ctx.logger?.info?.('context-handoff: browser UI registered')
      },
    }
  },
})
