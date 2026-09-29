package com.edu.platform.common;

/**
 * 互动消息类型常量
 */
public class MsgType {

    private MsgType() {
    }

    /** 弹幕 */
    public static final String DANMAKU = "DANMAKU";
    /** 提问 */
    public static final String QUESTION = "QUESTION";
    /** 举手 */
    public static final String HAND_RAISE = "HAND_RAISE";
    /** 取消举手（仅 WS 消息，不落库） */
    public static final String HAND_RAISE_CANCEL = "HAND_RAISE_CANCEL";
    /** 发起投票 */
    public static final String VOTE_START = "VOTE_START";
    /** 投票提交 */
    public static final String VOTE_SUBMIT = "VOTE_SUBMIT";
    /** 结束投票 */
    public static final String VOTE_END = "VOTE_END";

    /** 以下为服务端主动推送类型（不落库） */

    /** 在线人数变化 */
    public static final String ONLINE = "ONLINE";
    /** 直播状态变化 */
    public static final String LIVE_STATUS = "LIVE_STATUS";
    /** 投票实时结果 */
    public static final String VOTE_RESULT = "VOTE_RESULT";
    /** 错误提示（仅回发送者） */
    public static final String ERROR = "ERROR";
}
