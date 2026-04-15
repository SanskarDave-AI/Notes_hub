module sr_ff_behavioral(Q, Qbar, S, R);
    input S, R;
    output reg Q;
    output Qbar;

    assign Qbar = ~Q;

    always @(S or R) begin
        if (S == 1 && R == 0)
            Q = 1;        
        else if (S == 0 && R == 1)
            Q = 0;        
        else if (S == 0 && R == 0)
            Q = Q;        
        else
            Q = 1'bx;     
    end

endmodule


module test;

    reg S, R;
    wire Q, Qbar;

    sr_ff_behavioral uut (Q, Qbar, S, R);

    initial begin
        $monitor("S=%b R=%b Q=%b Qbar=%b", S, R, Q, Qbar);

        S = 0; R = 0; #10;  
        S = 1; R = 0; #10;   
        S = 0; R = 0; #10;   
        S = 0; R = 1; #10;  
        S = 0; R = 0; #10;   
        S = 1; R = 1; #10;  
        S = 1; R = 0; #10;   
    end

endmodule




