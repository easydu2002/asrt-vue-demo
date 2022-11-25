
// @ts-nocheck
import { globalOptions } from ".."
import { Pin_Yin, Sheng_Diao, Wen_Zi } from "../types"
import { getLCS } from "../util/lcs"
import { commands, commandParams, getDict, getInvertedIndex } from "./command"

/**
 * 多级权重
  权重影响因子 （顺序无关）
   (主要算法类似于 求两个字符串的公共子串)
  0. 全拼最大连续匹配个数 全拼最大连续长度
  1. 文字最大连续匹配个数 文字最大联系长度
  2. 全拼连续累计匹配次数  拼音最大连续长度
  3. 文字连续匹配次数 首拼最大连续长度
  4. 拼音最大连续匹配个数
  5. 拼音连续匹配次数
  6. 全拼包含个数
  7. 拼音包含个数
  8. 文字包含个数
  9. 各种模糊匹配
 */
type WeightList = [number, number, number, number, number, number, number, number, number, number]

  
interface Keywords {
  label: string,
  speech: number[][],
}


/**
 * 拼音文字解析
 * @param {Array<String>} speechs 
 */
 export const resolveWords = function(speechs: string[]) {
	// let result = ''
	// speechs.forEach(item => {
	// 	result += dict[item.substring(0, item.length - 1)] || ''
	// })
	// return result
}

/**
 * 
 * @param texts 文字
 * @returns 
 */
 export const resolveSpeechs = function(texts: Wen_Zi[]) {
  
  const invertedIndex = getInvertedIndex()
	const result:[string, number][] = []
	texts.forEach(text => {
    const index = invertedIndex.get(text)
    // @ts-ignore
    index && result.push(index)
	})
	return result
}

/**
 * 通过索引获取文字
 * @param indexes
 */
export const resolveWordsByIndexes = function(indexes: [Pin_Yin, Sheng_Diao][]) {

  const dict = getDict()
  return indexes.map(item => item.map(inx => dict.get(inx[0])?.get(inx[1])))
}

/**
 * 命令解析
 * @param {Array} speechs 拼音集合
 * @param {String} language 文字
 */
export const resolveCommand = function(speechs: string[], language: string[]) {
  
}

/**
 * 用户关键字解析（命令参数）
 * @param {String} command 命令
 * @param {Array} speechs 拼音集合
 * @param {String} language 文字
 */
export const resolveCommandParams = function(command: string, speechs: string[], language: string[]) {
  // const words = resolveWords(speechs)
  const params = commandParams.get(command || 'target')
  if(!params) return

  // { 命令参数 => 权重 }
  const weightMap:Map<string, WeightList> = new Map()
  params.forEach(item => {
    if(item.length <= speechs.length) {
      weightMap.set(item, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    }
  })

  // example: da3 kai1 biao1 tu2 biao1 hui4
  // slice(2)
  // 给定一组数据，查找该数据在example中最大连续匹配的次数
  // biao1 tu2

  weightMap.forEach((weight, param) => {
    
    // 参数对应的词典树索引
    const paramIndexes = resolveSpeechs(Array.from(param))
    // 索引对应的拼音
    const probSpeechs:string[][] = paramIndexes.map(item => item.map(i => i[0]+i[1]))
    // index
    const probLabels = resolveWordsByIndexes(paramIndexes)
    // 
  // 0. 全拼最大连续匹配个数 全拼最大连续长度
  // 1. 文字最大连续匹配个数 文字最大联系长度
  // 2. 全拼连续累计匹配次数  拼音最大连续长度
  // 3. 文字连续匹配次数 首拼最大连续长度

    const record: number[][] = new Array(speechs.length).fill(Array.from(new Array(probSpeechs.length), () => [0, 0, 0, 0]))
    for(let i = 0; i < speechs.length; ++i) {
      const speechFirst = speechs[i].slice(0, 1)
      const speechN = speechs[i].slice(0, -1)
      for (let j = 0; j < probSpeechs.length; ++j) {

        for(let k = 0; k < probSpeechs[j].length; k++) {

          // 连续全拼probSpeechs[j].includes(speechs[i])
          if(probSpeechs[j][k] === speechs[i]) {
            if (i == 0 || j == 0) {
              record[i][j][0] = 1;
            } else {
              record[i][j][0] = record[i - 1][j - 1][0] + 1;
            }
          }

          // 连续文字
          if (probLabels[j][k][0] === language[i]) {
            if (i == 0 || j == 0) {
              record[i][j][1] = 1;
            } else {
              record[i][j][1] = record[i - 1][j - 1][1] + 1;
            }
          }

          // 连续拼音
          if (probSpeechs[j][k].slice(0, -1) === speechN) {
            if (i == 0 || j == 0) {
              record[i][j][2] = 1;
            } else {
              record[i][j][2] = record[i - 1][j - 1][2] + 1;
            }
          }

          // 连续首拼
          if (probSpeechs[j][k].slice(0, 1) === speechFirst) {
            if (i == 0 || j == 0) {
              record[i][j][3] = 1;
            } else {
              record[i][j][3] = record[i - 1][j - 1][3] + 1;
            }
          }
        }

  
        if (record[i][j][0] > weight[0]) {
          weight[0] = record[i][j][0];
        }
        
        if (record[i][j][1] > weight[1]) {
          weight[1] = record[i][j][1];
        }
        
        if (record[i][j][2] > weight[2]) {
          weight[2] = record[i][j][2];
        }
        
        if (record[i][j][3] > weight[3]) {
          weight[3] = record[i][j][3];
        }
      }
    }

  })
  
  return Array.from(weightMap)
    .map(item => [item[0], item[1].reduce((r, c, k) => r + c * globalOptions.weightLevel[k], 0)])
    .sort((a,b) => (b[1] as number) - (a[1] as number))
}

/**
 * 解析命令+参数
 * @param {Array} speechs 拼音
 * @param {String} language 文字
 */
export const resolveAll = function(speechs: string[], language: string[]) {

  const words = ''??resolveWords(speechs)
  const command = ''??resolveCommand(speechs, language)
  // 去掉识别的命令数量，这里没处理好... ...后面再改了
  const params = resolveCommandParams(command, speechs, language)
  console.debug('>>>', params)
  return {
    words,
    command,
    params
  }
}

