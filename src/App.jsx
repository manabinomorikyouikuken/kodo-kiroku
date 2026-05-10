import { useState, useMemo } from 'react'

// ── データ構造 ──────────────────────────────────────
const PLACES = ['教室', '廊下', '体育館', '給食', '休み時間', 'その他']
const BEHAVIORS = ['離席', '大声', '他者への行動', '自傷', '固まる', '泣く', '暴れる', 'その他']
const ANTECEDENTS = ['指示', '活動の切り替え', '待ち時間', '感覚刺激', '注目されない', 'その他']
const CONSEQUENCES = ['声かけ', '別室移動', '作業変更', '休憩', '無対応', 'その他']

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

function load(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

// ── メインアプリ ────────────────────────────────────
export default function App() {
  const [view, setView] = useState('home')
  const [children, setChildren] = useState(() => load('children', []))
  const [records, setRecords] = useState(() => load('records', []))
  const [activeChild, setActiveChild] = useState(null)

  const saveChildren = v => { setChildren(v); save('children', v) }
  const saveRecords  = v => { setRecords(v);  save('records', v) }

  const addChild = (name, grade) => {
    const c = { id: genId(), name, grade }
    saveChildren([...children, c])
  }
  const deleteChild = id => {
    if (!confirm('この子どもと全記録を削除しますか？')) return
    saveChildren(children.filter(c => c.id !== id))
    saveRecords(records.filter(r => r.childId !== id))
  }
  const addRecord = rec => {
    const r = { id: genId(), ...rec, createdAt: new Date().toISOString() }
    saveRecords([r, ...records])
  }
  const deleteRecord = id => saveRecords(records.filter(r => r.id !== id))

  const childRecords = useMemo(
    () => activeChild ? records.filter(r => r.childId === activeChild.id) : [],
    [records, activeChild]
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-green-700 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        {view !== 'home' && (
          <button onClick={() => setView(view === 'record' ? 'detail' : 'home')} className="text-white text-xl leading-none">←</button>
        )}
        <h1 className="font-bold text-lg flex-1">
          {view === 'home' && '行動きろく'}
          {view === 'detail' && activeChild?.name}
          {view === 'record' && '記録する'}
          {view === 'stats' && `${activeChild?.name} の傾向`}
        </h1>
        {view === 'detail' && (
          <button onClick={() => setView('stats')} className="text-xs bg-green-600 px-3 py-1 rounded-full">傾向</button>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        {view === 'home'   && <HomeView children={children} onAdd={addChild} onDelete={deleteChild} onSelect={c => { setActiveChild(c); setView('detail') }} />}
        {view === 'detail' && <DetailView child={activeChild} records={childRecords} onRecord={() => setView('record')} onDelete={deleteRecord} />}
        {view === 'record' && <RecordForm child={activeChild} onSave={rec => { addRecord(rec); setView('detail') }} />}
        {view === 'stats'  && <StatsView child={activeChild} records={childRecords} />}
      </main>
    </div>
  )
}

// ── ホーム（子ども一覧） ─────────────────────────────
function PrivacyNotice() {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden text-sm">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-amber-800 font-bold">
        <span>⚠️ 個人情報の取り扱いに関する注意事項</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 text-amber-900 text-xs leading-relaxed border-t border-amber-200">
          <p className="font-bold mt-2">このアプリを使用する前に必ずお読みください。</p>
          <ul className="space-y-2 list-none">
            <li>📱 <strong>端末内保存：</strong>記録データはこの端末の中だけに保存されます。外部サーバーへの送信は一切ありません。</li>
            <li>🔒 <strong>端末の管理：</strong>必ず端末にパスコード・生体認証を設定し、他者が操作できない状態にしてください。</li>
            <li>👤 <strong>実名を避ける：</strong>子どもの名前はイニシャルや番号（例：A児・1番）で登録することを推奨します。</li>
            <li>🏫 <strong>学校のルールに従う：</strong>学校・施設の個人情報管理規定および情報セキュリティポリシーに従って使用してください。</li>
            <li>🗑️ <strong>端末の廃棄・譲渡：</strong>端末を廃棄・譲渡する際は、必ずすべての記録を削除してください。</li>
            <li>📋 <strong>記録の目的：</strong>このアプリで記録した情報は支援目的以外に使用しないでください。</li>
            <li>⚖️ <strong>法令遵守：</strong>個人情報保護法および学校教育に関連する法令・ガイドラインを遵守して使用してください。</li>
          </ul>
          <p className="text-amber-700 mt-2">本アプリは支援の補助ツールであり、記録内容の管理責任は利用者にあります。</p>
        </div>
      )}
    </div>
  )
}

function HomeView({ children, onAdd, onDelete, onSelect }) {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [adding, setAdding] = useState(false)

  const submit = () => {
    if (!name.trim()) return
    onAdd(name.trim(), grade.trim())
    setName(''); setGrade(''); setAdding(false)
  }

  return (
    <div className="space-y-4">
      <PrivacyNotice />
      <p className="text-sm text-slate-500">子どもを選んで記録を始めましょう</p>

      {children.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
          まだ子どもが登録されていません
        </div>
      )}

      {children.map(c => (
        <div key={c.id} className="bg-white rounded-xl border border-slate-200 flex items-center px-4 py-3 gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg flex-shrink-0">
            {c.name[0]}
          </div>
          <button onClick={() => onSelect(c)} className="flex-1 text-left">
            <div className="font-bold text-slate-800">{c.name}</div>
            {c.grade && <div className="text-xs text-slate-400">{c.grade}</div>}
          </button>
          <button onClick={() => onDelete(c.id)} className="text-slate-300 hover:text-red-400 text-xl leading-none">×</button>
        </div>
      ))}

      {adding ? (
        <div className="bg-white rounded-xl border border-green-300 p-4 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="名前（必須）"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          <input value={grade} onChange={e => setGrade(e.target.value)} placeholder="学年・クラス（任意）"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-lg border border-slate-300 text-sm text-slate-600">キャンセル</button>
            <button onClick={submit} className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-bold">追加</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-green-300 text-green-600 text-sm font-bold hover:bg-green-50">
          ＋ 子どもを追加
        </button>
      )}
    </div>
  )
}

// ── CSV出力 ─────────────────────────────────────────
function exportCSV(child, records) {
  const header = '日時,場所,行動,直前の出来事,対応・結果,メモ'
  const rows = records.map(r => [
    new Date(r.createdAt).toLocaleString('ja-JP'),
    r.place, r.behavior, r.antecedent || '', r.consequence || '',
    (r.note || '').replace(/,/g, '、').replace(/\n/g, ' ')
  ].map(v => `"${v}"`).join(','))
  const bom = '﻿'
  const blob = new Blob([bom + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${child.name}_行動記録_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── 記録一覧 ────────────────────────────────────────
function DetailView({ child, records, onRecord, onDelete }) {
  return (
    <div className="space-y-4">
      <button onClick={onRecord}
        className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg shadow-md active:bg-green-700">
        ＋ 今の行動を記録する
      </button>

      {records.length > 0 && (
        <button onClick={() => exportCSV(child, records)}
          className="w-full py-2 rounded-xl border border-green-400 text-green-700 text-sm font-bold hover:bg-green-50">
          📥 CSVで書き出す（Excel・連絡帳用）
        </button>
      )}

      {records.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
          まだ記録がありません
        </div>
      )}

      {records.map(r => (
        <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString('ja-JP')}</span>
            <button onClick={() => onDelete(r.id)} className="text-slate-300 hover:text-red-400 text-sm">削除</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag label={r.place} color="blue" />
            <Tag label={r.behavior} color="red" />
            {r.antecedent && <Tag label={`前：${r.antecedent}`} color="amber" />}
            {r.consequence && <Tag label={`後：${r.consequence}`} color="green" />}
          </div>
          {r.note && <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{r.note}</p>}
        </div>
      ))}
    </div>
  )
}

// ── 記録フォーム ────────────────────────────────────
function RecordForm({ child, onSave }) {
  const [place, setPlace]       = useState('')
  const [behavior, setBehavior] = useState('')
  const [antecedent, setAnte]   = useState('')
  const [consequence, setCons]  = useState('')
  const [note, setNote]         = useState('')

  const submit = () => {
    if (!place || !behavior) { alert('場所と行動は必須です'); return }
    onSave({ childId: child.id, place, behavior, antecedent, consequence, note })
  }

  return (
    <div className="space-y-5">
      <SelectGroup label="📍 場所" options={PLACES} value={place} onChange={setPlace} />
      <SelectGroup label="⚡ 行動" options={BEHAVIORS} value={behavior} onChange={setBehavior} />
      <SelectGroup label="◀ 直前の出来事" options={ANTECEDENTS} value={antecedent} onChange={setAnte} optional />
      <SelectGroup label="▶ 対応・結果" options={CONSEQUENCES} value={consequence} onChange={setCons} optional />

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">メモ（任意）</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="気づいたことを自由に..."
          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none" />
      </div>

      <button onClick={submit}
        className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg shadow-md">
        記録を保存
      </button>
    </div>
  )
}

function SelectGroup({ label, options, value, onChange, optional }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}{optional && <span className="text-slate-400 font-normal text-xs ml-1">（任意）</span>}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button key={o} onClick={() => onChange(value === o ? '' : o)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${value === o ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-300'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 傾向グラフ ──────────────────────────────────────
function StatsView({ child, records }) {
  const count = (key) => records.reduce((acc, r) => {
    acc[r[key]] = (acc[r[key]] || 0) + 1; return acc
  }, {})

  const behaviorCount = count('behavior')
  const placeCount    = count('place')
  const max = Math.max(...Object.values(behaviorCount), 1)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-bold text-slate-700 mb-3 text-sm">行動の種類（{records.length}件）</h2>
        {Object.entries(behaviorCount).sort((a,b) => b[1]-a[1]).map(([k,v]) => (
          <div key={k} className="mb-2">
            <div className="flex justify-between text-xs text-slate-600 mb-1"><span>{k}</span><span>{v}回</span></div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-3 bg-green-500 rounded-full" style={{ width: `${(v/max)*100}%` }} />
            </div>
          </div>
        ))}
        {records.length === 0 && <p className="text-sm text-slate-400">記録がまだありません</p>}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-bold text-slate-700 mb-3 text-sm">場所別</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(placeCount).sort((a,b) => b[1]-a[1]).map(([k,v]) => (
            <span key={k} className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">{k}：{v}回</span>
          ))}
          {records.length === 0 && <p className="text-sm text-slate-400">記録がまだありません</p>}
        </div>
      </div>
    </div>
  )
}

function Tag({ label, color }) {
  const c = {
    blue:  'bg-blue-50 text-blue-700',
    red:   'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
  }[color]
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c}`}>{label}</span>
}
