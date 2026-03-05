import { Colors } from './colors.js';

export namespace Diff {
  export const lcs = (linesA: string[], linesB: string[]) => {
    const n = linesA.length;
    const m = linesB.length;
    const dp = Array.from({ length: n + 1 }, () => Array.from({ length: m + 1 }, () => 0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (linesA[i - 1] === linesB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const commonLines = new Set<string>();

    let i = n;
    let j = m;

    while (i > 0 && j > 0) {
      if (linesA[i - 1] === linesB[j - 1]) {
        commonLines.add(linesA[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) i--;
      else j--;
    }

    return commonLines;
  };

  export const print = (path: string, contentA: string, contentB: string) => {
    console.log(`${Colors.FgYellow}diff a/${path} b/${path}${Colors.Reset}`);
    console.log(`--- a/${path}`);
    console.log(`+++ b/${path}`);

    const linesA = contentA.split(/\r?\n/);
    const linesB = contentB.split(/\r?\n/);
    const commonLines = lcs(linesA, linesB);

    let i = 0;
    let j = 0;
    while (i < linesA.length || j < linesB.length) {
      if (i < linesA.length && !commonLines.has(linesA[i])) {
        console.log(`${Colors.FgRed}-${linesA[i]}${Colors.Reset}`);
        i++;
      } else if (j < linesB.length && !commonLines.has(linesB[j])) {
        console.log(`${Colors.FgGreen}+${linesB[j]}${Colors.Reset}`);
        j++;
      } else {
        console.log(` ${linesA[i]}`);
        i++;
        j++;
      }
    }
  };
}
