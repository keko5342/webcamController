cc.Class({
    extends: cc.Component,

    properties: {
        SJ_PI_X_2: { // ２π
            default: Math.PI * 2, // デフォルト値
            type: cc.Float, // 型
            visible: false, // 『Proeperties』パネルに表示しない
            readonly: true, // 読み取りのみ
        },
        SJ_DEG2RAD: { // 角度からラジアンへの変換係数
            default: Math.PI / 180, // デフォルト値
            type: cc.Float, // 型
            visible: false, // 『Proeperties』パネルに表示しない
            readonly: true, // 読み取りのみ
        },
        SJ_RAD2DEG: { // ラジアンから角度への変換係数
            default: 180 / Math.PI, // デフォルト値
            type: cc.Float, // 型
            visible: false, // 『Proeperties』パネルに表示しない
            readonly: true, // 読み取りのみ
        },
        Thumb: { // ジョイスティックの部分のノード
            default: null, // デフォルト値
            type: cc.Node, // 型
            visible: false, // 『Proeperties』パネルに表示しない
        },
        Directions: 8, // 方向数
        HasDeadzone: true, // デッドゾーンの有無
        DeadRadius: 20, // デッドゾーンの半径
        _DeadRadiusSq: 400, // デッドゾーンの半径の２乗
        AutoCenter: true, // センター自動復帰の有無
        isDPad: true, // デジタルジョイスティック機能の有効無効、true:有効、false:無効
    	_degrees: 0, // ジョイスティックの角度
	    _velocity: cc.Vec2.ZERO, // スティックの値
	    JoystickRadius: { // ジョイスティックの半径 0の場合は、背景画像の幅の1/2に設定
	        default: 0, // デフォルト値
	        type: cc.Integer, // 型
	        tooltip: "if 0 then radius = Image.Width / 2", // 説明
	    },
	    _JoystickRadiusSq: 0, // ジョイスティックの半径の２乗
	    _stickPosition: cc.Vec2.ZERO, // スティックの表示位置(0, 0)
	    _centerPosition: cc.Vec2.ZERO, // ジョイスティックの中心座標
        _running: false, // ループ実行中フラグ、true:実行中、false：停止中
        _valiableText: 'ok',
    },
    // 初期化処理
    onLoad: function () {
        this._DeadRadiusSq = Math.pow(this.DeadRadius, 2);　// デッドゾーンの半径の２乗を計算
        // ジョイスティックのタッチの有効範囲
        this._centerPosition = cc.p( // ジョイスティックの中心座標を取得
            this.node.getContentSize().width / 2, // 背景画像の幅の1/2
            this.node.getContentSize().height / 2); // 背景画像の高さの1/2
        if (this.JoystickRadius === 0){　// 入力値が0の場合
            this.JoystickRadius = this._centerPosition.x; // 半径を画像の幅の1/2に設定
        }
        this._JoystickRadiusSq = Math.pow(this.JoystickRadius, 2); // 半径の２乗を計算
        // 親指のスプライトの取得
        this.Thumb = this.node.getChildByName("Thumb"); // "Thumb"ノードを取得
      
        cc.eventManager.addListener({ // タッチイベントを登録
            event: cc.EventListener.TOUCH_ONE_BY_ONE, // シングルタッチのみ対応
            swallowTouches:false, // false:以降のノードにタッチイベントを渡す
            onTouchBegan: this.onTouchBegan.bind(this), // タッチ開始
            onTouchMoved: this.onTouchMoved.bind(this), // タッチ中
            onTouchEnded: this.onTouchEnded.bind(this), // タッチ終了
            onTouchCanceled:  this.onTouchCanceled.bind(this), // タッチキャンセル
        }, this.node);
        
	    this._running = true; // ループ開始
    },
    onTouchBegan:function(touch, event){ // タッチ開始時処理
        var location = this.node.convertToNodeSpace(touch.getLocation()); // タッチ座標を取得（画面の座標）し、自ノードの座標に変換
        location = cc.p(location.x - this._centerPosition.x, location.y - this._centerPosition.y); // 中心が原点の座標に変換
        var dSq = Math.pow(location.x, 2) + Math.pow(location.y, 2); // 中心からタッチ位置までの距離の２乗を計算
        if (this._JoystickRadiusSq > dSq) {  // タッチが範囲内の場合
            this.updateVelocity(location); // スティックの値の更新処理
        } else {
            return false; // タッチイベントを中断
        }
	    return true; // true:タッチイベントを継続
    },
	onTouchMoved:function(touch, event){ // タッチ中の処理
        var location = this.node.convertToNodeSpace(touch.getLocation()); // タッチ座標を取得（画面の座標）し、自ノードの座標に変換
        location = cc.p(location.x - this._centerPosition.x, location.y - this._centerPosition.y); // 中心が原点の座標に変換
        this.updateVelocity(location); // スティックの値の更新処理
	},
	onTouchEnded:function(touch, event){ // タッチ終了時処理
        var location = cc.Vec2.ZERO; // （0, 0）の変数を作成
        if (!this.AutoCenter) { // 自動センター復帰機能が無効の場合
            location = this.node.convertToNodeSpace(touch.getLocation()); // タッチ座標を取得（画面の座標）し、自ノードの座標に変換
            location = cc.p(location.x - this._centerPosition.x, location.y - this._centerPosition.y); // 中心が原点の座標に変換
        }
        this.updateVelocity(location); // スティックの値の更新処理
        this._valiableText = 'None Direction';
	},
	onTouchCanceled:function(touch, event){ //タッチキャンセル時処理
        this.onTouchEnded(touch, event); // タッチ終了時処理を実行
	},
	updateVelocity:function(point){ // スティックの値の更新処理
		var dx = point.x; // スティックの値のx座標
		var dy = point.y; // スティックの値のy座標
		var dSq = Math.pow(dx, 2) + Math.pow(dy, 2); // 中心からの距離の２乗を計算
		if (dSq <= this._DeadRadiusSq) { // デッドゾーンの範囲内の場合
			this._velocity = cc.Vec2.ZERO; // スティックの値に（0,0）を設定
			this._degrees = 0; // スティックの角度を0に設定
			this._stickPosition = cc.Vec2.ZERO; // スティックの表示位置を中心にする
			return;
        }
        this._valiableText = 'ok';
        var angle = Math.atan2(dy, dx); // x軸+方向からのラジアンを計算
        if (angle < 0){ // 負の値の場合
            angle += this.SJ_PI_X_2; // ２πを加算して、正の値にする
		}
		if (this.isDPad) { // デジタルジョイスティック有効の場合
			var anglePerSector = (360 / this.Directions) * this.SJ_DEG2RAD; // 分解能１セクション分のラジアンを計算
            angle = Math.floor(angle / anglePerSector + 0.5) * anglePerSector; // 属するセクションの境界の角度に丸める
		}
		var cosAngle = this.calcRound(Math.cos(angle), 3); // cos値の計算
		var sinAngle = this.calcRound(Math.sin(angle), 3); // sin値の計算
		if (dSq > this._JoystickRadiusSq || this.isDPad) { 
			dx = cosAngle * this.JoystickRadius; // ジョイスティック表示位置のx座標を計算
			dy = sinAngle * this.JoystickRadius; // ジョイスティック表示位置のy座標を計算
		}
		if(this.isDPad){
		    this._velocity = cc.p(cosAngle, sinAngle); // スティックの値を設定（値の範囲 x:-1.0〜1.0, y:-1.0〜1.0）
		} else {
		    this._velocity = cc.p(dx / this.JoystickRadius, dy / this.JoystickRadius); // スティックの値を設定（値の範囲 x:-1.0〜1.0, y:-1.0〜1.0）
		}
        this._degrees = angle * this.SJ_RAD2DEG; // ラジアンから角度を計算

        // テキストで角度を取得
        this._valiableText = this.getDirectionText();

        this._stickPosition = cc.p(dx, dy); // ジョイスティックの表示位置を設定
	},
    update: function (dt) { // 周期処理
        if (!this._running) return; // trueになるまでループを実行しない
        if (this.Thumb !== null && this._stickPosition!== null) {
            this.Thumb.setPosition(this._stickPosition); // 親指部分の位置を設定
        }
    },
    calcRound: function(value, digits) { // 小数点指定桁数以下を四捨五入
        var digitsNum = Math.pow(10, digits); // 10のdigits乗を計算
        return Math.floor(value * digitsNum + 0.5) / digitsNum; // 小数点指定桁数以下を四捨五入
    },
    getVelocity: function () {  // スティックの値を返す
        return this._velocity;
    },
    getDirection: function () {
        return this._valiableText;
    },
    getDirectionText: function () {
        var text;
        switch (this._degrees) {
            case 0:
                text = 'Right';
                break;
            case 360:
                text = 'Right';
                break;
            case 180:
                text = 'Left';
                break;
            case 45:
                text = 'Upper right';
                break;
            case 90:
                text = 'Up';
                break;
            case 135:
                text = 'Upper left';
                break;
            case 225:
                text = 'Lower Left';
                break;
            case 270:
                text = 'Down';
                break;
            case 315:
                text = 'Lower Right';
                break;
            default:
                text = this._degrees + '℃';
        }
        return text;     
    }
});
