import * as Papa from 'papaparse';

// 程序导出的交易记录类型
export interface AppExportTransaction {
  date: string;
  type: string;
  amount: string;
  categoryName: string;
  description: string;
  createdAt: string;
}

// 解析程序导出的CSV文件
export async function parseAppExportCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    // 检查文件类型
    if (!file.name.endsWith('.csv')) {
      reject(new Error('不支持的文件格式，仅支持CSV文件'));
      return;
    }
    
    console.log('开始解析程序导出的CSV文件:', file.name);
    console.log('文件大小:', file.size, 'bytes');
    console.log('文件类型:', file.type);
    
    Papa.parse(file, {
      header: true, // 使用第一行作为表头
      dynamicTyping: true,
      encoding: 'UTF-8',
      skipEmptyLines: true,
      complete: (results) => {
        try {
          console.log('Papaparse解析完成，结果:', results);
          
          const data = results.data;
          
          if (!data || data.length === 0) {
            console.log('解析结果为空');
            reject(new Error('文件内容为空'));
            return;
          }
          
          // 输出前几行数据以便调试
          console.log('CSV文件解析后前5行数据:');
          for (let i = 0; i < Math.min(5, data.length); i++) {
            console.log(`第${i+1}行:`, data[i]);
          }
          
          // 验证表头
          const firstRow = data[0];
          if (!firstRow || typeof firstRow !== 'object') {
            reject(new Error('文件格式不正确，无法识别表头'));
            return;
          }
          
          // 检查必要的字段
          const requiredFields = ['日期', '类型', '金额'];
          const hasRequiredFields = requiredFields.every(field => 
            Object.prototype.hasOwnProperty.call(firstRow, field)
          );
          
          if (!hasRequiredFields) {
            reject(new Error('文件格式不正确，缺少必要的字段'));
            return;
          }
          
          // 解析交易记录
          const transactions: any[] = [];
          
          for (const row of data) {
            if (typeof row === 'object' && row !== null) {
              const transaction = parseAppExportRow(row);
              if (transaction) {
                transactions.push(transaction);
              }
            }
          }
          
          if (transactions.length === 0) {
            reject(new Error('未找到有效的交易记录'));
            return;
          }
          
          console.log(`解析完成，共找到${transactions.length}条有效交易记录`);
          resolve(transactions);
        } catch (error) {
          console.error('解析程序导出CSV文件错误:', error);
          reject(new Error('解析CSV文件失败，请检查文件格式是否正确'));
        }
      },
      error: (error) => {
        console.error('Papaparse解析错误:', error);
        reject(new Error('解析CSV文件失败，请检查文件格式是否正确'));
      }
    });
  });
}

// 解析程序导出的交易记录行
function parseAppExportRow(row: any): any {
  try {
    // 验证必要字段
    if (!row['日期'] || !row['类型'] || !row['金额']) {
      return null;
    }
    
    // 解析日期
    const date = new Date(row['日期']);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // 解析金额
    const amountStr = String(row['金额']).trim();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return null;
    }
    
    // 解析交易类型
    let type = row['类型'];
    let direction = '';
    
    if (type === '收入') {
      type = 'income';
      direction = '收入';
    } else if (type === '支出') {
      type = 'expense';
      direction = '支出';
    } else if (type === '中性') {
      type = 'neutral';
      direction = '/';
    } else {
      return null;
    }
    
    // 构建交易对象
    const transaction = {
      id: row['ID'], // 保存原始交易ID
      transactionTime: date,
      type: type === 'income' ? '收入' : type === 'expense' ? '支出' : '中性',
      amount: amount,
      merchant: row['描述'] || '',
      goods: '',
      direction: direction,
      transactionStatus: '成功',
      transactionNo: row['ID'] ? `APP-${row['ID']}` : `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 使用原始ID或生成临时交易单号
      remark: row['描述'] || ''
    };
    
    return transaction;
  } catch (error) {
    console.error('解析交易记录行错误:', error);
    return null;
  }
}
