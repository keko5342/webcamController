cc.Class({
    extends: cc.Component,

    properties: {
        label: {
            default: null,
            type: cc.Label
        },
        text: 'Hello, World!',
        joypadStick: {  // �W���C�X�e�B�b�N
            default: null, // �f�t�H���g�l
            type: cc.Node, // cc.Node�^
        },
        joypadButton: { // �{�^��
            default: null, // �f�t�H���g�l
            type: cc.Node, // cc.Node�^
        },
    },

    // use this for initialization
    onLoad: function () {
        this.label.string = this.text;
    },

    // called every frame
    update: function (dt) {
        if(this.joypadButton.getComponent("JoypadButton").getValue() === 1) { // �{�^���������ꂽ�ꍇ
            this.label.node.setPosition(0, -180); // ���x���̈ʒu���ŏ��̈ʒu�ɖ߂�
        }
        var pos = this.label.node.getPosition(); // ���݂̈ʒu���擾
        var velocity = this.joypadStick.getComponent("JoypadStick").getVelocity(); // �W���C�X�e�B�b�N�̒l���擾
        var valiableText = this.joypadStick.getComponent("JoypadStick").getDirection();
        
//        this.label.node.setPosition(pos.x + velocity.x * 10, pos.y + velocity.y * 10); // ���x�����ړ�
        this.label.node.setPosition(pos.x, pos.y); // ���x�����ړ�
        var request = new XMLHttpRequest();
        request.open("GET", `www.google.com`);
        request.addEventListener("load", (event) => {
            console.log(event.target.status);
            valiableText = event.target.responseText;
        });
        request.send();
        this.label.string = valiableText;
    },
});