import express, { Request, Response } from "express";
import { assert } from "node:console";
import { AnyRecord } from "node:dns";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: any = {};

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  // TODO: implement me
  const newName : string = recipeName
                            .replace(/[-_]/g, " ")
                            .replace(/[^a-zA-Z ]/g, "")
                            .trim()
                            .toLowerCase()
                            .replace(/\b[a-z]/g, (match) => match.toUpperCase());
  if (newName.length === 0) {
    return null;
  }
  return newName;
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  // TODO: implement me
  const { type, name } = req.body;

  if (cookbook[name] !== undefined || type !== "ingredient" && type !== "recipe") {
    res.status(400).json();
    return;

  } else if (type === "ingredient") {
    if (req.body.cookTime < 0) {
      res.status(400).json();
      return;
    }

    let cookTime = req.body.cookTime;
    cookbook[`${name}`] = { type, name, cookTime };

  } else {
    const required : requiredItem[] = req.body.requiredItems;
    if (duplicateRequired(required)) {
      res.status(400).json();
      return;
    }

    cookbook[`${name}`] = { type, name, requiredItems: required };
  }

  res.status(200).json({});
});


const duplicateRequired = (required : requiredItem[]): boolean => {
  const seen : Record<string, any> = {};
  for (const i of required) {
    if (seen[i.name] === true) {
      return true;
    }

    seen[i.name] = true;
  }
  return false;
}
// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Response) => {
  const name = req.query.name as string;

  if (cookbook[name] === undefined || cookbook[name].type !== "recipe") {
    res.status(400).json();
    return;
  }
  
  const summary : Record<string, any> = { name, cooktime: 0, requiredItems: {}};

  if (!ingredientBreakdown(name, 1, summary)) {
    res.status(400).json();
    return;
  }

  summary["ingredients"] = Object.values(summary.requiredItems);
  delete summary.requiredItems;
  
  res.status(200).json(summary);
});

// returns false if contains an invalid ingredient true otherwise
const ingredientBreakdown = (name :string, count: number, summary: any) : boolean => {
  const item : cookbookEntry = cookbook[name];
  if (item === undefined) {
    return false;
  }
  if (item.type === "ingredient") {
    summary.cooktime += (item as ingredient).cookTime * count;
    if (summary.requiredItems[item.name] === undefined) {
      summary.requiredItems[item.name] = {name: item.name, quantity: count}
    } else {
      summary.requiredItems[item.name].quantity += count;
    }
    return true;
  }

  for (const subItem of (item as recipe).requiredItems) {
    if (ingredientBreakdown(subItem.name, subItem.quantity * count, summary) === false) {
      return false;
    }
  }

  return true;
}
// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
