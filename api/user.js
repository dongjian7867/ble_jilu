// api/save-visitor.js
import { createClient } from '@supabase/supabase-js';

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

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
      try {
      const { device, ble_addr } = JSON.parse(body);
      if (!device || !ble_addr) {
        return res.status(400).json({ error: '缺少 device 或 ble_addr' });
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const tableName = 'user-info'; // 👈 重要：改成你的真实表名，比如 'ble_logs'

	  const { error } = await supabase
          .from(tableName)
          .upsert(
            [{ device, ble_addr, jingwei: cleanIP }],
            { onConflict: 'ble_addr' } // 指定冲突字段
          );

      if (error) {
           return res.status(200).json({
              success: false,
              inserted: false,
              total: 0
            });
      }

      // 4. 返回结果
      res.status(200).json({
        success: true,
        inserted: true,
        total: 0
      });

    } catch (err) {
      console.error('后端错误:', err.message);
      res.status(500).json({ error: '服务器内部错误' });
    }
  });
};
