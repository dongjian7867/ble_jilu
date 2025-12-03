// api/save-visitor.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbhxunklvlctcbrrmvmr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHh1bmtsdmxjdGNicnJtdm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDY2OTMsImV4cCI6MjA3OTUyMjY5M30.OF4p3aHMxc3kQRseZyvw1dZDBJ4UB1vtsL6VPut4icI';

module.exports = async (req, res) => {
  // 1. 只接受 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  // 2. 获取客户端 IP
  const clientIP =
    req.headers['x-real-ip'] ||
    (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
    'unknown';

  const cleanIP = clientIP.startsWith('::ffff:') ? clientIP.substring(7) : clientIP;

  // 3. 直接使用 req.body（Vercel/Next.js 已自动解析）
  const { device, ble_addr } = req.body || {};

  if (!device || !ble_addr) {
    return res.status(400).json({ error: '缺少 device 或 ble_addr' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const tableName = 'user-info'; // 确保表名正确（注意大小写和连字符）

    const { error } = await supabase
      .from(tableName)
      .upsert(
        [{ device, ble_addr, jingwei: cleanIP }],
        { onConflict: 'ble_addr' }
      );

    if (error) {
      console.error('Supabase upsert error:', error);
      return res.status(200).json({
        success: false,
        inserted: false,
        total: 0
      });
    }

    // 可选：获取总记录数
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      success: true,
      inserted: true, // 注意：upsert 不区分 insert/update，这里可设为 true 或根据业务调整
      total: countError ? 0 : count
    });

  } catch (err) {
    console.error('后端错误:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};

