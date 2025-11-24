// api/save-visitor.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hbhxunklvlctcbrrmvmr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHh1bmtsdmxjdGNicnJtdm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDY2OTMsImV4cCI6MjA3OTUyMjY5M30.OF4p3aHMxc3kQRseZyvw1dZDBJ4UB1vtsL6VPut4icI';

module.exports = async (req, res) => {
  // 只接受 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const { device, ble_addr, jingwei } = data;

      // 验证必要字段
      if (!device || !ble_addr) {
        return res.status(400).json({ error: '缺少 device 或 ble_addr' });
      }

      // 连接 Supabase
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // 插入数据（假设你的表名是 user-info）
      const { error } = await supabase
        .from('user-info') // 👈 替换为你的实际表名！
        .insert([
          { 
            device: device,
            ble_addr: ble_addr,
            jingwei: jingwei || null // 允许为空
          }
        ]);

      if (error) {
        console.error('Supabase 错误:', error);
        return res.status(500).json({ error: '数据库写入失败' });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('解析错误:', err);
      res.status(400).json({ error: '无效的 JSON 数据' });
    }
  });
};
