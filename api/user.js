// api/save-visitor.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbhxunklvlctcbrrmvmr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHh1bmtsdmxjdGNicnJtdm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDY2OTMsImV4cCI6MjA3OTUyMjY5M30.OF4p3aHMxc3kQRseZyvw1dZDBJ4UB1vtsL6VPut4icI';

module.exports = async (req, res) => {
  // 只接受 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }
      // ✅ 步骤 1：从 Vercel 请求头中获取客户端真实公网 IP
  const clientIP = req.headers['x-real-ip'] || 
                   (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
                   'unknown';
  // 可选：清理 IPv6 映射的 IPv4（如 ::ffff:1.2.3.4 → 1.2.3.4）
  const cleanIP = clientIP.startsWith('::ffff:') ? clientIP.substring(7) : clientIP;


	export default async function handler(req, res) {
  
		  try {
			const supabase = createClient(supabaseUrl, supabaseAnonKey);
			const tableName = 'user-info';

			// ✅ 关键优化：直接 upsert（1 次请求，原子操作）
			const { data, error } = await supabase
			  .from(tableName)
			  .upsert(
				[{ device, ble_addr, jingwei: cleanIP }],
				{ onConflict: 'ble_addr', ignoreDuplicates: false }
			  )
			  .select(); // ← 获取实际写入的数据（用于判断是否新增）

			if (error) {
			  console.error('Supabase upsert failed:', error);
			  // ✅ 即使 DB 出错，也返回统一结构（不 500）
			  return res.status(200).json({
				success: false,
				inserted: false,
				total: 0
			  });
			}

			// 判断是否为新插入：如果返回的数据中 created_at 是刚生成的（或对比时间）
			// 更简单方式：假设只要没报错，就认为操作成功
			// 如果你需要精确知道是否“新增”，可加一个默认值字段如 `first_seen`
			const inserted = true; // 注意：upsert 成功即视为有效操作

			// ⚡️ 如果你不需要实时 total，直接返回（最快！）
			return res.status(200).json({
			  success: true,
			  inserted,
			  total: 0 // 或省略，前端自己累加
			});

		  } catch (err) {
			console.error('Unexpected error:', err);
			return res.status(200).json({
			  success: false,
			  inserted: false,
			  total: 0
			});
		  }
  }
};
