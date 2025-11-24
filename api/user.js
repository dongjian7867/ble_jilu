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
      const { device, ble_addr, jingwei } = JSON.parse(body);
      if (!device || !ble_addr) {
        return res.status(400).json({ error: '缺少 device 或 ble_addr' });
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const tableName = 'user-info'; // 👈 重要：改成你的真实表名，比如 'ble_logs'

      // 1. 检查是否已存在相同 ble_addr
      const { data: existing, error: checkError } = await supabase
        .from(tableName)
        .select('ble_addr')
        .eq('ble_addr', ble_addr)
        .limit(1);

      if (checkError) throw checkError;

      let inserted = false;
      if (existing.length === 0) {
        // 2. 不存在 → 插入
        const { error: insertError } = await supabase
          .from(tableName)
          .insert([{ device, ble_addr, jingwei }]);
        if (insertError) throw insertError;
        inserted = true;
      }

      // 3. 查询去重后的总设备数（按 ble_addr 去重）
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('ble_addr', { count: 'exact', head: true });

      if (countError) throw countError;

      // 4. 返回结果
      res.status(200).json({
        success: true,
        inserted,
        total: count
      });

    } catch (err) {
      console.error('后端错误:', err.message);
      res.status(500).json({ error: '服务器内部错误' });
    }
  });
};
