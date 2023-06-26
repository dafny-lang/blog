Blockly.Blocks['tpl_true'] = {
  init: function() {
    this.jsonInit({
      "message0": 'True',
      "args0": [
      ],
      "output": "Expr",
      "colour": 80,
      "tooltip": "An expression representing True"
    });
  }
};
// Let's define the javascript to generate to be _module.Term.create_True()
Blockly.JavaScript['tpl_true'] = function(block) {
  var code = '_module.Term.create_True()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

Blockly.Blocks['tpl_false'] = {
  init: function() {
    this.jsonInit({
      "message0": 'False',
      "args0": [
      ],
      "output": "Expr",
      "colour": 80,
      "tooltip": "An expression representing False"
    });
  }
};
Blockly.JavaScript['tpl_false'] = function(block) {
  var code = '_module.Term.create_False()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

Blockly.Blocks['tpl_zero'] = {
  init: function() {
    this.jsonInit({
      "message0": 'Zero',
      "args0": [
      ],
      "output": "Expr",
      "colour": 80,
      "tooltip": "An expression representing the constant 0"
    });
  }
};
Blockly.JavaScript['tpl_zero'] = function(block) {
  var code = '_module.Term.create_Zero()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

Blockly.Blocks['tpl_succ'] = {
  init: function() {
    this.jsonInit({
      "message0": 'Succ %1',
      "args0": [
        {
          "type": "input_value",
          "name": "VALUE",
          "check": "Expr"
        }
      ],
      "output": "Expr",
      "colour": 160,
      "tooltip": "An expression whose meaning is to return +1 of its argument"
    });
  }
};
Blockly.JavaScript['tpl_succ'] = function(block) {
  var value_value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var code = value_value == "" ? "" :
  '_module.Term.create_Succ(' + value_value + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

Blockly.Blocks['tpl_pred'] = {
  init: function() {
    this.jsonInit({
      "message0": 'Pred %1',
      "args0": [
        {
          "type": "input_value",
          "name": "VALUE",
          "check": "Expr"
        }
      ],
      "output": "Expr",
      "colour": 160,
      "tooltip": "An expression whose meaning is to return -1 of its argument"
    });
  }
};

Blockly.JavaScript['tpl_pred'] = function(block) {
  var value_value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var code = value_value == "" ? "" :
  '_module.Term.create_Pred(' + value_value + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}
Blockly.Blocks['tpl_iszero'] = {
  init: function() {
    this.jsonInit({
      "message0": 'IsZero %1',
      "args0": [
        {
          "type": "input_value",
          "name": "VALUE",
          "check": "Expr"
        }
      ],
      "output": "Expr",
      "colour": 160,
      "tooltip": "An expression whose meaning is to test if its argument is zero"
    });
  }
};

Blockly.JavaScript['tpl_iszero'] = function(block) {
  var value_value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var code = value_value == "" ? "" :
    '_module.Term.create_IsZero(' + value_value + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

Blockly.Blocks['tpl_double'] = {
  init: function() {
    this.jsonInit({
      "message0": 'Double %1',
      "args0": [
        {
          "type": "input_value",
          "name": "VALUE",
          "check": "Expr"
        }
      ],
      "output": "Expr",
      "colour": 160,
      "tooltip": "An expression whose meaning is to double its argument"
    });
  }
};

Blockly.JavaScript['tpl_double'] = function(block) {
  var value_value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var code = value_value == "" ? "" :
    '_module.Term.create_Double(' + value_value + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

Blockly.Blocks['tpl_add'] = {
  init: function() {
    this.jsonInit({
      "message0": 'Add %1 %2',
      "args0": [
        {
          "type": "input_value",
          "name": "LEFT",
          "check": "Expr"
        },
        {
          "type": "input_value",
          "name": "RIGHT",
          "check": "Expr"
        }
      ],
      "output": "Expr",
      "colour": 180,
      "tooltip": "An expression whose meaning is to add both arguments"
    });
  }
};

Blockly.JavaScript['tpl_add'] = function(block) {
  var value_left = Blockly.JavaScript.valueToCode(block, 'LEFT', Blockly.JavaScript.ORDER_ATOMIC);
  var value_right = Blockly.JavaScript.valueToCode(block, 'RIGHT', Blockly.JavaScript.ORDER_ATOMIC);
  var code = value_left == "" || value_right == "" ? "" :
    '_module.Term.create_Add(' + value_left + ', ' + value_right + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

Blockly.Blocks['tpl_ifthenelse'] = {
  init: function() {
    this.jsonInit({
      "message0": 'if %1 then %2 else %3',
      "args0": [
        {
          "type": "input_value",
          "name": "COND",
          "check": "Expr"
        },
        {
          "type": "input_value",
          "name": "THEN",
          "check": "Expr"
        },
        {
          "type": "input_value",
          "name": "ELSE",
          "check": "Expr"
        }
      ],
      "output": "Expr",
      "colour": 200,
      "tooltip": "An expression whose meaning is the usual if-then-else"
    });
  }
};

Blockly.JavaScript['tpl_ifthenelse'] = function(block) {
  var value_cond = Blockly.JavaScript.valueToCode(block, 'COND', Blockly.JavaScript.ORDER_ATOMIC);
  var value_then = Blockly.JavaScript.valueToCode(block, 'THEN', Blockly.JavaScript.ORDER_ATOMIC);
  var value_else = Blockly.JavaScript.valueToCode(block, 'ELSE', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 
    value_cond == "" || value_then == "" || value_else == "" ? "" :
    '_module.Term.create_If(' + value_cond + ', ' + value_then + ', ' + value_else + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
}

Blockly.Blocks['tpl_typecheck'] = {
  init: function() {
    this.jsonInit({
      "message0": 'Type-check %1',
      "args0": [
        {
          "type": "input_value",
          "name": "PROG",
          "check": "Expr"
        }
      ],
      "colour": 0,
      "tooltip": "Checks that the expression type-checks."
    });
  }
};
// Let's assume typecheck is a function

Blockly.JavaScript['tpl_typecheck'] = function(block) {
  var value_prog = Blockly.JavaScript.valueToCode(block, 'PROG', Blockly.JavaScript.ORDER_ATOMIC);
  var block_id = block.id;
  if(value_prog == "") {
    value_prog = null;
  }
  var code = 'typecheck(' + value_prog + ', "' + block_id + '")';
  return code;
}
Blockly.Blocks['tpl_evaluate'] = {
  init: function() {
    this.jsonInit({
      "message0": 'Evaluate %1',
      "args0": [
        {
          "type": "input_value",
          "name": "PROG",
          "check": "Expr"
        }
      ],
      "colour": 0,
      "tooltip": "Evaluate the given expression."
    });
  }
};

Blockly.JavaScript['tpl_evaluate'] = function(block) {
  var value_prog = Blockly.JavaScript.valueToCode(block, 'PROG', Blockly.JavaScript.ORDER_ATOMIC);
  var block_id = block.id;
  var code = 'evaluate(' + value_prog + ', "' + block_id + '")';
  return code;
}
  const toolbox = {
  "kind": "flyoutToolbox",
  "contents": [
    {
      "kind": "block",
      "type": "tpl_typecheck"
    },
    {
      "kind": "block",
      "type": "tpl_evaluate"
    },
    {
      "kind": "block",
      "type": "tpl_true"
    },
    {
      "kind": "block",
      "type": "tpl_false"
    },
    {
      "kind": "block",
      "type": "tpl_zero"
    },
    {
      "kind": "block",
      "type": "tpl_succ"
    },
    {
      "kind": "block",
      "type": "tpl_pred"
    },
    {
      "kind": "block",
      "type": "tpl_iszero"
    },
    {
      "kind": "block",
      "type": "tpl_double"
    },
    {
      "kind": "block",
      "type": "tpl_add"
    },
    {
      "kind": "block",
      "type": "tpl_ifthenelse"
    }
  ]
}
const workspace = Blockly.inject('blocklyDiv', {toolbox: toolbox});

// paste the JSON obtained by
// copy(JSON.stringify(Blockly.serialization.workspaces.save(workspace)))
const saves = {
  "load": {"blocks":{"languageVersion":0,"blocks":[{"type":"tpl_typecheck","id":"f!{vc~S?{oN/AN9#-WEd","x":36,"y":43,"inputs":{"PROG":{"block":{"type":"tpl_false","id":"27/Ta`n|}V*B)s7Zr}^V"}}}},{"type":"tpl_typecheck","id":"}jBAI,)Z[-h9^YMj`d.C","x":40,"y":89,"inputs":{"PROG":{"block":{"type":"tpl_succ","id":"Wg.KkAfKbDnbO*$Ju_w)","inputs":{"VALUE":{"block":{"type":"tpl_zero","id":"/lso.r/,iQDh6r/5gmvL"}}}}}}},{"type":"tpl_typecheck","id":"Hp}wuF~]hWLt;*KEhl`?","x":35,"y":137,"inputs":{"PROG":{"block":{"type":"tpl_pred","id":"Kk1[+NpaH;A}IuOQ-KX,","inputs":{"VALUE":{"block":{"type":"tpl_false","id":"eE26RO)YKHQ%Y^MKIx};"}}}}}}},{"type":"tpl_typecheck","id":"/Jw^Q4s6;dX_E%4Mi68P","x":36,"y":189,"inputs":{"PROG":{"block":{"type":"tpl_add","id":"o#6QF^=-D2A2YL[%!+$.","inputs":{"LEFT":{"block":{"type":"tpl_true","id":"w9=@wIVtNi,B=,F7Z:Gy"}},"RIGHT":{"block":{"type":"tpl_zero","id":"|]:[g[PLex#-:KZ(ipHC"}}}}}}},{"type":"tpl_typecheck","id":"I}e~5o62(l[|9{Mo{6~N","x":36,"y":265,"inputs":{"PROG":{"block":{"type":"tpl_ifthenelse","id":"7@@Kk/))h*cE=X9cPt?z","inputs":{"COND":{"block":{"type":"tpl_iszero","id":"@.?y9L(p(syKv6@{p$In","inputs":{"VALUE":{"block":{"type":"tpl_zero","id":",%8_]Q-:eG}?RBI2-Mv8"}}}}},"THEN":{"block":{"type":"tpl_true","id":"O.%EqhW=guWa/}_@VgdO"}},"ELSE":{"block":{"type":"tpl_false","id":"v2HUJJ6V;vD.mXgM@Q6R"}}}}}}},{"type":"tpl_typecheck","id":"fGln6C:MQ^KV,q6^aP-*","x":36,"y":370,"inputs":{"PROG":{"block":{"type":"tpl_ifthenelse","id":"$F%f0%9qx7ZuzYXGNo|m","inputs":{"COND":{"block":{"type":"tpl_pred","id":"rcf`:vl8:5muZ/`Z2R6/","inputs":{"VALUE":{"block":{"type":"tpl_zero","id":"{{*~+KyR_oj(QcEe~DQx"}}}}},"THEN":{"block":{"type":"tpl_zero","id":"+?LdO~Y-p/tJ{aUIk?vf"}},"ELSE":{"block":{"type":"tpl_zero","id":"s(%_?Jh+wkF`7vAV-PBQ"}}}}}}}]}},
  "img-intro":  {"blocks":{"languageVersion":0,"blocks":[{"type":"tpl_typecheck","id":"g[R@z-}PCuS^Y?5zH=Ms","x":61,"y":109,"inputs":{"PROG":{"block":{"type":"tpl_ifthenelse","id":"ZWLi_~J,DIp1f*Nq9(sj","inputs":{"COND":{"block":{"type":"tpl_pred","id":"_F3vx.z_#:ML)J}X:7;t","inputs":{"VALUE":{"block":{"type":"tpl_false","id":"3cV;]X%;!C=8hIM-jvNw"}}}}},"THEN":{"block":{"type":"tpl_zero","id":"%/0xQ~W.z!ss!D{|lA3^"}},"ELSE":{"block":{"type":"tpl_iszero","id":"koB,vwdW]eVDIe,+1f!;","inputs":{"VALUE":{"block":{"type":"tpl_succ","id":"#mLOw6)QZ.EJ^Gr;S!0,","inputs":{"VALUE":{"block":{"type":"tpl_true","id":"3F4?/@wX2Q|NGLYMho.%"}}}}}}}}}}}}}]}},
  "example1": {"blocks":{"languageVersion":0,"blocks":[{"type":"tpl_evaluate","id":"0!AojB:vPD;(VTk4PZ[;","x":24,"y":43,"inputs":{"PROG":{"block":{"type":"tpl_add","id":"61[SIVubQGcX@RGbL._R","inputs":{"LEFT":{"block":{"type":"tpl_double","id":"l%@5QGn|nri?cs^q{tv;","inputs":{"VALUE":{"block":{"type":"tpl_succ","id":"ZxJpdCbE7{r!|El=imB2","inputs":{"VALUE":{"block":{"type":"tpl_succ","id":"?(vrZcaCNhCJ]Gk=[TB9","inputs":{"VALUE":{"block":{"type":"tpl_zero","id":":Gb~|QCi|;d492Y,BR^-"}}}}}}}}}}},"RIGHT":{"block":{"type":"tpl_pred","id":"FBfIe_k_Xef4(R!HrJ8V","inputs":{"VALUE":{"block":{"type":"tpl_double","id":"LntSNH-w9-Szt)!aR..)","inputs":{"VALUE":{"block":{"type":"tpl_pred","id":"$U7*B}XkZT$hh,A)A`.o","inputs":{"VALUE":{"block":{"type":"tpl_zero","id":"WB~nD/066xffC|4krL5?"}}}}}}}}}}}}}}}}]}},
  "example2": {"blocks":{"languageVersion":0,"blocks":[{"type":"tpl_evaluate","id":"0!AojB:vPD;(VTk4PZ[;","x":0,"y":23,"inputs":{"PROG":{"block":{"type":"tpl_ifthenelse","id":"x|}Yla-?nfhKP270$LBL","inputs":{"COND":{"block":{"type":"tpl_iszero","id":"vCWaJokC_JWP+p0erZ:{","inputs":{"VALUE":{"block":{"type":"tpl_add","id":";NAvze[|j)qn5HYN./XZ","inputs":{"LEFT":{"block":{"type":"tpl_succ","id":"Kwys.Q:D=X,_[?wZJ4!7","inputs":{"VALUE":{"block":{"type":"tpl_succ","id":"j9qZd98o`U3+3dZ@vw$Y","inputs":{"VALUE":{"block":{"type":"tpl_zero","id":"LED^,.$czD^^mPegb90n"}}}}}}}},"RIGHT":{"block":{"type":"tpl_double","id":"zvhJ+*KLuMD}eqp/lZsw","inputs":{"VALUE":{"block":{"type":"tpl_pred","id":"=YmUnfmCQWnoYW_wo1MC","inputs":{"VALUE":{"block":{"type":"tpl_zero","id":"=bCPeW#Ld7mgX*{I^C+l"}}}}}}}}}}}}}},"THEN":{"block":{"type":"tpl_ifthenelse","id":".3@VoN.Pg,$wgsV51:[x","inputs":{"COND":{"block":{"type":"tpl_ifthenelse","id":"i7C+x;_0C6;~@=:LET,+","inputs":{"COND":{"block":{"type":"tpl_false","id":"h3rgWtQq`@!3X4m=^=T7"}},"THEN":{"block":{"type":"tpl_true","id":"lRUMJlJEfBxw[_IW+o_*"}},"ELSE":{"block":{"type":"tpl_false","id":"tnL-!9:}Y:=Y31^Cru}9"}}}}},"THEN":{"block":{"type":"tpl_zero","id":"5ugQ}yI,uM!4[iTw%8a_"}},"ELSE":{"block":{"type":"tpl_double","id":"Q]H!J3Q7[|*2y/~7v`}k","inputs":{"VALUE":{"block":{"type":"tpl_double","id":"m)lKgc+%NmD5B9Les~fB","inputs":{"VALUE":{"block":{"type":"tpl_succ","id":"8c%{E|,jNhaJ1::k-I$n","inputs":{"VALUE":{"block":{"type":"tpl_zero","id":"V#+2o_Bod^YbsW72cM#|"}}}}}}}}}}}}}},"ELSE":{"block":{"type":"tpl_zero","id":"zK-:p#at1Ay=+I2CD*A3"}}}}}}}]}}
};

function loadExamples() {
  const clickableImages = document.querySelectorAll(".clickable");

  for(var i = 0; i < clickableImages.length; i++) {
    let clickableImage = clickableImages[i];
    clickableImage.onclick = function() {
      let id = this.getAttribute("id");
      let state = saves[id];
      Blockly.serialization.workspaces.load(state, workspace);
      document.getElementById("blocklyDiv").scrollIntoView();
    }
  }
  Blockly.serialization.workspaces.load(saves["load"], workspace);
}
// Run loadExamples when the page finished loading
document.addEventListener("DOMContentLoaded", loadExamples);

function require() {
  // No op
  return globalThis.BigNumber;
}

function SelectRenderedBlock(block_id) {
  var selector = "[data-id='"+block_id+"']";
  return document.querySelector(selector);
}

function typecheck(expr, block_id) {
  var outline;
  var result = false;
  if(expr == null) {
    outline = "";
  } else {
    if(_module.__default.WellTyped(expr)) {
      result = true;
      outline = "3px solid #00ff00";
    } else {
      outline = "3px solid #ff0000";
    }
    // TODO: Run the type checker on it!
  }
  console.log("Typechecker ran on " + expr + " with block id " + block_id);
  SelectRenderedBlock(block_id).style.outline = outline;
  return result;
}
function evaluate(expr, block_id) {
  console.log("Evaluator ran on " + expr + " with block id " + block_id);
  return expr;
}

function BlocklyEvent(event) {
  /*if(event.type == Blockly.Events.BLOCK_DRAG || event.type == Blockly.Events.BLOCK_MOVE ) {
    return;
  }
  if(event.type != Blockly.Events.BLOCK_CREATE
     && event.type != Blockly.Events.BLOCK_DELETE
     && event.type != Blockly.Events.BLOCK_CHANGE) {
    return;
  }*/
  var code = Blockly.JavaScript.workspaceToCode(workspace);
  eval(code);
}
workspace.addChangeListener(BlocklyEvent);

// Let's build the block Succ(Zero) programmatically
function SuccZero() {
  var block = workspace.newBlock('tpl_succ');
  var input = block.getInput('VALUE');
  input.connection.connect(workspace.newBlock('tpl_zero').outputConnection);
  return block;
}
// Let's display this block in the workspace
function DisplaySuccZero() {
  //workspace.getTopBlocks()
}

function ExpressionToBlock(input, expr) {
  var block;
  var create_block = function(type) {
    block = workspace.newBlock(type);
    input.connection.connect(block.outputConnection);
    block.initSvg();
    block.render();
    return block;
  }
  if(expr.is_True) {
    block = create_block('tpl_true');
  } else if(expr.is_False) {
    block = create_block('tpl_false');
  } else if(expr.is_Zero) {
    block = create_block('tpl_zero');
  } else if(expr.is_Succ) {
    block = create_block('tpl_succ');
    ExpressionToBlock(block.getInput('VALUE'), expr.dtor_e);
  } else if(expr.is_Pred) {
    block = create_block('tpl_pred');
    ExpressionToBlock(block.getInput('VALUE'), expr.dtor_e);
  } else if(expr.is_IsZero) {
    block = create_block('tpl_iszero');
    ExpressionToBlock(block.getInput('VALUE'), expr.dtor_e);
  } else if(expr.is_Double) {
    block = create_block('tpl_double');
    ExpressionToBlock(block.getInput('VALUE'), expr.dtor_e);
  } else if(expr.is_Add) {
    block = create_block('tpl_add');
    ExpressionToBlock(block.getInput('LEFT'), expr.dtor_left);
    ExpressionToBlock(block.getInput('RIGHT'), expr.dtor_right);
  } else if(expr.is_If) {
    block = create_block('tpl_ifthenelse');
    ExpressionToBlock(block.getInput('COND'), expr.dtor_cond);
    ExpressionToBlock(block.getInput('THEN'), expr.dtor_thn);
    ExpressionToBlock(block.getInput('ELSE'), expr.dtor_els);
  } else {
    throw "Unknown expression type";
  }
}

document.querySelector("#Evaluate").onclick = function() {
  var x = workspace.getTopBlocks();
  var evaluated = false;
  var hasEvaluateBlock = false;
  var evaluateBlockAreFinal = true;
  for(var i = 0; i < x.length; i++) {
    if(x[i].type == "tpl_evaluate") {
      hasEvaluateBlock = true;
      var expr = eval(Blockly.JavaScript.blockToCode(x[i]));
      if(typecheck(expr, x[i].id) && !_module.__default.IsFinalValue(expr)) {
        evaluateBlockAreFinal = false;
        evaluated = true;
        //Delete the previous PROG input
        var input = x[i].getInput('PROG');
        if(input.connection.isConnected()) {
          var oldBlock = input.connection.targetBlock();
          oldBlock.dispose();
        }

        var oneStep = _module.__default.OneStepEvaluate(expr);
        var input = x[i].getInput('PROG');
        var newBlock = ExpressionToBlock(input, oneStep);
        console.log("Added ", newBlock);
      }
    }
  }
  if(!evaluated) {
    if(!hasEvaluateBlock) {
      alert("No program to evaluate! Add a 'Evaluate' block or click on one example below.");
    } else {
      alert("All evaluate blocks either don't type check or have final values!");
    }
  }
}