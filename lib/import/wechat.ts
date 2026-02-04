import * as Papa from 'papaparse';

export interface WeChatTransaction {
  transactionTime: Date;
  type: string;
  amount: number;
  merchant: string;
  goods: string;
  direction: string;
  transactionStatus: string;
  transactionNo: string;
  remark: string;
}

export async function parseWeChatBill(file: File): Promise<WeChatTransaction[]> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.csv')) {
      reject(new Error('不支持的文件格式，仅支持CSV文件'));
      return;
    }
    
    console.log('开始解析微信账单CSV文件:', file.name);
    console.log('文件大小:', file.size, 'bytes');
    console.log('文件类型:', file.type);
    
    Papa.parse(file, {
      header: true,
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
          
          console.log('CSV文件解析后前5行数据:');
          for (let i = 0; i < Math.min(5, data.length); i++) {
            console.log(`第${i+1}行:`, data[i]);
          }
          
          const firstRow = data[0];
          if (!firstRow || typeof firstRow !== 'object') {
            reject(new Error('文件格式不正确，无法识别表头'));
            return;
          }
          
          const requiredFields = ['交易时间', '交易类型', '交易金额', '交易对方'];
          const hasRequiredFields = requiredFields.every(field => 
            Object.prototype.hasOwnProperty.call(firstRow, field)
          );
          
          if (!hasRequiredFields) {
            reject(new Error('文件格式不正确，缺少必要的字段'));
            return;
          }
          
          const transactions: WeChatTransaction[] = [];
          
          for (const row of data) {
            if (typeof row === 'object' && row !== null) {
              const transaction = parseWeChatRow(row);
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
          console.error('解析微信账单CSV文件错误:', error);
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

function parseWeChatRow(row: any): WeChatTransaction | null {
  try {
    if (!row['交易时间'] || !row['交易类型'] || !row['交易金额'] || !row['交易对方']) {
      return null;
    }
    
    const date = new Date(row['交易时间']);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    const amountStr = String(row['交易金额']).trim();
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      return null;
    }
    
    const transaction: WeChatTransaction = {
      transactionTime: date,
      type: row['交易类型'] || '',
      amount: Math.abs(amount),
      merchant: row['交易对方'] || '',
      goods: row['商品'] || '',
      direction: row['收/支'] || '',
      transactionStatus: row['交易状态'] || '成功',
      transactionNo: row['交易单号'] || '',
      remark: row['备注'] || ''
    };
    
    return transaction;
  } catch (error) {
    console.error('解析微信交易记录行错误:', error);
    return null;
  }
}
