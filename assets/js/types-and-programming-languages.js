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
/*Blockly.Blocks['tpl_controls_repeat_ext'] = {
  init: function() {
    this.jsonInit(
{
  "message0": "repeat %1 times",
  "args0": [
    {"type": "input_value", "name": "TIMES", "check": "Expr"}
  ],
  "message1": "do %1",
  "args1": [
    {"type": "input_statement", "name": "DO"}
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 120
});
}
};*/
  const toolbox = {
  "kind": "flyoutToolbox",
  "contents": [
    /*{
      "kind": "block",
      "type": "tpl_controls_repeat_ext"
    },*/
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
      "type": "tpl_ifthenelse"
    }
  ]
}
const workspace = Blockly.inject('blocklyDiv', {toolbox: toolbox});

// paste the JSON obtained by
// copy(JSON.stringify(Blockly.serialization.workspaces.save(workspace)))
const saves = {
  "img-intro":  {"blocks":{"languageVersion":0,"blocks":[{"type":"tpl_typecheck","id":"g[R@z-}PCuS^Y?5zH=Ms","x":61,"y":109,"inputs":{"PROG":{"block":{"type":"tpl_ifthenelse","id":"ZWLi_~J,DIp1f*Nq9(sj","inputs":{"COND":{"block":{"type":"tpl_pred","id":"_F3vx.z_#:ML)J}X:7;t","inputs":{"VALUE":{"block":{"type":"tpl_false","id":"3cV;]X%;!C=8hIM-jvNw"}}}}},"THEN":{"block":{"type":"tpl_zero","id":"%/0xQ~W.z!ss!D{|lA3^"}},"ELSE":{"block":{"type":"tpl_iszero","id":"koB,vwdW]eVDIe,+1f!;","inputs":{"VALUE":{"block":{"type":"tpl_succ","id":"#mLOw6)QZ.EJ^Gr;S!0,","inputs":{"VALUE":{"block":{"type":"tpl_true","id":"3F4?/@wX2Q|NGLYMho.%"}}}}}}}}}}}}}]}}

};

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

function require() {
  // No op
  return globalThis.BigNumber;
}

function typecheck(expr, block_id) {
  var outline;
  if(expr == null) {
    outline = "";
  } else {
    if(_module.__default.WellTyped(expr)) {
      outline = "3px solid #00ff00";
    } else {
      outline = "3px solid #ff0000";
    }
    // TODO: Run the type checker on it!
  }
  console.log("Typechecker ran on " + expr + " with block id " + block_id);
  var selector = "[data-id='"+block_id+"']";
  console.log("selector:", selector);
  document.querySelector(selector).style.outline = outline;
}
function evaluate(expr, block_id) {
  console.log("Evaluator ran on " + expr + " with block id " + block_id);
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