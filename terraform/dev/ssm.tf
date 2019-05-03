resource "aws_ssm_parameter" "AUTHREQ_S3_BUCKET" {
  name  = "/fpw/AUTHREQ_S3_BUCKET"
  type  = "String"
  value = "forgotpw-authorized-requests-${var.environment}"
}

resource "aws_ssm_parameter" "AUTOGEN_S3_BUCKET" {
  name  = "/fpw/AUTOGEN_S3_BUCKET"
  type  = "String"
  value = "forgotpw-passwordautogen-${var.environment}"
}
