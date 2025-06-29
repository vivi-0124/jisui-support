import { NextRequest, NextResponse } from 'next/server';

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      thumbnails: {
        medium: {
          url: string;
        };
      };
      publishedAt: string;
    };
  }>;
}

interface YouTubeCaptionsResponse {
  items: Array<{
    id: string;
    snippet: {
      videoId: string;
      language: string;
      name: string;
      trackKind: string;
    };
  }>;
}

interface ExtractedRecipe {
  title: string;
  ingredients: string[];
  steps: string[];
  servings?: string;
  cookingTime?: string;
  description: string;
  extractionMethod: 'captions' | 'description' | 'ai_analysis';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: '動画IDが必要です' },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'YouTube API キーが設定されていません' },
        { status: 500 }
      );
    }

    // 1. 動画の基本情報を取得
    const videoDetails = await getVideoDetails(videoId, apiKey);
    if (!videoDetails) {
      return NextResponse.json(
        { error: '動画が見つかりませんでした' },
        { status: 404 }
      );
    }

    // 2. 字幕データを取得を試行
    let extractedRecipe: ExtractedRecipe;
    
    try {
      const captions = await getCaptions(videoId, apiKey);
      if (captions && captions.length > 0) {
        // 字幕から抽出
        const captionText = await getCaptionText(captions[0].id, apiKey);
        extractedRecipe = await extractRecipeFromCaptions(
          videoDetails.title,
          captionText,
          videoDetails.description
        );
        extractedRecipe.extractionMethod = 'captions';
      } else {
        throw new Error('字幕が見つかりません');
      }
    } catch (captionError) {
      console.log('字幕取得失敗、説明文から抽出します:', captionError);
      // 字幕が取得できない場合は説明文から抽出
      extractedRecipe = extractRecipeFromDescription(
        videoDetails.title,
        videoDetails.description
      );
      extractedRecipe.extractionMethod = 'description';
    }

    // 3. AI分析を試行（OpenAI APIが利用可能な場合）
    if (process.env.OPENAI_API_KEY && extractedRecipe.ingredients.length < 3) {
      try {
        const aiAnalyzedRecipe = await analyzeWithAI(
          videoDetails.title,
          videoDetails.description,
          extractedRecipe
        );
        if (aiAnalyzedRecipe) {
          extractedRecipe = aiAnalyzedRecipe;
          extractedRecipe.extractionMethod = 'ai_analysis';
        }
      } catch (aiError) {
        console.log('AI分析失敗:', aiError);
      }
    }

    return NextResponse.json({ recipe: extractedRecipe });
  } catch (error) {
    console.error('レシピ抽出エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

async function getVideoDetails(videoId: string, apiKey: string) {
  const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
  const response = await fetch(detailsUrl);
  
  if (!response.ok) {
    throw new Error('動画詳細の取得に失敗しました');
  }

  const data: YouTubeVideoDetailsResponse = await response.json();
  
  if (!data.items || data.items.length === 0) {
    return null;
  }

  return {
    title: data.items[0].snippet.title,
    description: data.items[0].snippet.description,
    channelTitle: data.items[0].snippet.channelTitle,
  };
}

async function getCaptions(videoId: string, apiKey: string) {
  const captionsUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`;
  const response = await fetch(captionsUrl);
  
  if (!response.ok) {
    throw new Error('字幕リストの取得に失敗しました');
  }

  const data: YouTubeCaptionsResponse = await response.json();
  
  // 日本語の字幕を優先的に選択
  const japaneseCaptions = data.items?.filter(
    (item) => item.snippet.language === 'ja' || item.snippet.language === 'ja-JP'
  );
  
  if (japaneseCaptions && japaneseCaptions.length > 0) {
    return japaneseCaptions;
  }
  
  // 日本語がない場合は最初の字幕を使用
  return data.items || [];
}

async function getCaptionText(captionId: string, apiKey: string): Promise<string> {
  // 注意: YouTube Data API v3では字幕の内容を直接取得することはできません
  // 実際の実装では、youtube-dl-pythonやytdl-coreなどのライブラリを使用するか、
  // サードパーティのサービスを利用する必要があります
  
  // ここでは模擬的な実装を示します
  throw new Error('字幕内容の取得は現在サポートされていません');
}

async function extractRecipeFromCaptions(
  title: string,
  captionText: string,
  description: string
): Promise<ExtractedRecipe> {
  // 字幕テキストからレシピを抽出する処理
  const ingredients: string[] = [];
  const steps: string[] = [];
  let servings: string | undefined;
  let cookingTime: string | undefined;

  // 字幕テキストを解析してレシピ情報を抽出
  const lines = captionText.split('\n').map(line => line.trim()).filter(line => line);
  
  // 材料や手順を示すキーワードを検索
  const ingredientKeywords = ['材料', '用意', '必要', 'ingredient'];
  const stepKeywords = ['作り方', '手順', '次に', 'まず', 'そして', 'step'];
  
  let currentSection = '';
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // セクション判定
    if (ingredientKeywords.some(keyword => lowerLine.includes(keyword))) {
      currentSection = 'ingredients';
      continue;
    }
    
    if (stepKeywords.some(keyword => lowerLine.includes(keyword))) {
      currentSection = 'steps';
      continue;
    }
    
    // 人数・時間の抽出
    const servingMatch = line.match(/(\d+)人分/);
    if (servingMatch) {
      servings = servingMatch[1] + '人分';
    }
    
    const timeMatch = line.match(/(\d+)分/);
    if (timeMatch) {
      cookingTime = timeMatch[1] + '分';
    }
    
    // 材料・手順の抽出
    if (currentSection === 'ingredients' && line.length > 2 && line.length < 50) {
      ingredients.push(line);
    } else if (currentSection === 'steps' && line.length > 5 && line.length < 200) {
      steps.push(line);
    }
  }

  // 字幕から十分な情報が得られない場合は説明文も参照
  if (ingredients.length < 3 || steps.length < 3) {
    const descriptionRecipe = extractRecipeFromDescription(title, description);
    if (ingredients.length < 3) {
      ingredients.push(...descriptionRecipe.ingredients);
    }
    if (steps.length < 3) {
      steps.push(...descriptionRecipe.steps);
    }
  }

  return {
    title,
    ingredients: [...new Set(ingredients)], // 重複除去
    steps: [...new Set(steps)], // 重複除去
    servings,
    cookingTime,
    description,
    extractionMethod: 'captions',
  };
}

function extractRecipeFromDescription(title: string, description: string): ExtractedRecipe {
  const lines = description.split('\n').map(line => line.trim()).filter(line => line);
  
  const ingredients: string[] = [];
  const steps: string[] = [];
  let servings: string | undefined;
  let cookingTime: string | undefined;
  
  let currentSection = '';
  let stepCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // セクションの判定
    if (lowerLine.includes('材料') || lowerLine.includes('ingredient')) {
      currentSection = 'ingredients';
      continue;
    }
    
    if (lowerLine.includes('作り方') || lowerLine.includes('手順') || 
        lowerLine.includes('レシピ') || lowerLine.includes('method') || 
        lowerLine.includes('instruction') || lowerLine.includes('step')) {
      currentSection = 'steps';
      stepCounter = 0;
      continue;
    }

    // 人数の抽出
    if (lowerLine.includes('人分') || lowerLine.includes('serving')) {
      const servingMatch = line.match(/(\d+)人分|(\d+)\s*serving/i);
      if (servingMatch) {
        servings = servingMatch[1] || servingMatch[2] + '人分';
      }
      continue;
    }

    // 調理時間の抽出
    if (lowerLine.includes('分') && (lowerLine.includes('時間') || lowerLine.includes('調理') || lowerLine.includes('time'))) {
      const timeMatch = line.match(/(\d+)分|(\d+)\s*min/i);
      if (timeMatch) {
        cookingTime = timeMatch[1] || timeMatch[2] + '分';
      }
      continue;
    }

    // 材料の抽出
    if (currentSection === 'ingredients') {
      if (line.match(/[・•\-\*]/) || 
          line.match(/\d+/) || 
          line.match(/(g|ml|個|本|枚|袋|パック|大さじ|小さじ|カップ|適量|少々)/)) {
        const cleanedLine = line.replace(/^[・•\-\*\s]+/, '');
        if (cleanedLine && !cleanedLine.includes('http') && cleanedLine.length < 100) {
          ingredients.push(cleanedLine);
        }
      }
    }

    // 手順の抽出
    if (currentSection === 'steps') {
      if (line.match(/^\d+[\.．\)）]/) || 
          line.match(/[・•\-\*]/) ||
          (stepCounter < 20 && line.length > 10 && line.length < 200)) {
        
        let cleanedLine = line.replace(/^\d+[\.．\)）\s]*/, '');
        cleanedLine = cleanedLine.replace(/^[・•\-\*\s]+/, '');
        
        if (cleanedLine && !cleanedLine.includes('http') && 
            !cleanedLine.includes('チャンネル') && 
            !cleanedLine.includes('登録')) {
          steps.push(cleanedLine);
          stepCounter++;
        }
      }
    }
  }

  // 材料が見つからない場合、タイトルから推測
  if (ingredients.length === 0) {
    const commonIngredients = extractIngredientsFromTitle(title);
    ingredients.push(...commonIngredients);
  }

  return {
    title,
    ingredients,
    steps,
    servings,
    cookingTime,
    description,
    extractionMethod: 'description',
  };
}

function extractIngredientsFromTitle(title: string): string[] {
  const ingredients: string[] = [];
  const commonIngredients = [
    '玉ねぎ', 'にんじん', 'じゃがいも', '豚肉', '牛肉', '鶏肉',
    '卵', '米', 'パン', 'パスタ', 'トマト', 'きゅうり', 'レタス',
    '醤油', '味噌', '塩', '砂糖', '油', 'バター', 'チーズ'
  ];

  for (const ingredient of commonIngredients) {
    if (title.includes(ingredient)) {
      ingredients.push(ingredient);
    }
  }

  return ingredients;
}

async function analyzeWithAI(
  title: string,
  description: string,
  existingRecipe: ExtractedRecipe
): Promise<ExtractedRecipe | null> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return null;
  }

  try {
    const prompt = `
以下のYouTube動画のタイトルと説明文から、料理のレシピ情報を抽出してください。

タイトル: ${title}
説明文: ${description}

以下の形式でJSONで回答してください：
{
  "ingredients": ["材料1", "材料2", ...],
  "steps": ["手順1", "手順2", ...],
  "servings": "人数",
  "cookingTime": "調理時間"
}

材料は具体的な分量も含めて記載し、手順は順序立てて記載してください。
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const aiRecipe = JSON.parse(content);

    return {
      title,
      ingredients: aiRecipe.ingredients || existingRecipe.ingredients,
      steps: aiRecipe.steps || existingRecipe.steps,
      servings: aiRecipe.servings || existingRecipe.servings,
      cookingTime: aiRecipe.cookingTime || existingRecipe.cookingTime,
      description,
      extractionMethod: 'ai_analysis',
    };
  } catch (error) {
    console.error('AI分析エラー:', error);
    return null;
  }
}